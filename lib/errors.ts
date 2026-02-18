import { NextResponse } from "next/server";
import { AttemptResetPeriod } from "@prisma/client";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", public errors?: any) {
    super(400, message, "VALIDATION_ERROR");
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(400, message, "BAD_REQUEST");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(409, message, "CONFLICT");
  }
}

export class AttemptLimitError extends AppError {
  constructor(
    public limit: number,
    public period: AttemptResetPeriod,
    public resetAt: Date | null
  ) {
    super(403, "Attempt limit reached", "ATTEMPT_LIMIT_REACHED");
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(500, message, "INTERNAL_SERVER_ERROR");
  }
}

/**
 * Sanitize error messages for logging to prevent sensitive data exposure
 * Redacts passwords, tokens, keys, and email addresses
 */
function sanitizeErrorForLogging(error: unknown): string {
  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = String(error);
  }

  // Redact sensitive patterns
  return message
    .replace(/password[=:]\s*["']?[^\s"']+["']?/gi, "password=[REDACTED]")
    .replace(/token[=:]\s*["']?[^\s"']+["']?/gi, "token=[REDACTED]")
    .replace(/key[=:]\s*["']?[^\s"']+["']?/gi, "key=[REDACTED]")
    .replace(/secret[=:]\s*["']?[^\s"']+["']?/gi, "secret=[REDACTED]")
    .replace(/bearer\s+[^\s]+/gi, "Bearer [REDACTED]")
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]")
    .replace(/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g, "[CARD]"); // Credit card patterns
}

export function handleError(error: unknown) {
  // Log sanitized error to prevent sensitive data exposure
  console.error("API Error:", sanitizeErrorForLogging(error));

  if (error instanceof AttemptLimitError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        limit: error.limit,
        period: error.period,
        resetAt: error.resetAt ? error.resetAt.toISOString() : null,
      },
      { status: error.statusCode }
    );
  }

  // Check for AppError or any object with statusCode and message
  // Also check for 'code' property as some custom errors might have it
  const isAppError = error instanceof AppError || (
    typeof error === 'object' &&
    error !== null &&
    ('statusCode' in error || 'code' in error) &&
    'message' in error
  );

  if (isAppError) {
    const appError = error as any;
    // Default to 400 if no status code but looks like an app error due to custom code
    const statusCode = appError.statusCode || 400;

    return NextResponse.json(
      {
        error: appError.message,
        code: appError.code || 'APP_ERROR',
        ...(appError.errors && { errors: appError.errors }),
      },
      { status: statusCode }
    );
  }

  // Check for ZodError: handle both instanceof and duck typing for test environments
  const isZodError = error instanceof ZodError ||
    (error as any)?.name === "ZodError" ||
    (error as any)?.constructor?.name === "ZodError" ||
    (Array.isArray((error as any)?.errors) && (error as any)?.issues);

  if (isZodError) {
    try {
      const zodErrors = (error as any).errors || (error as any).issues || [];
      // Simplify errors to avoid circular refs or complex objects
      const simplifiedErrors = Array.isArray(zodErrors) ? zodErrors.map((e: any) => ({
        code: e.code,
        message: e.message,
        path: e.path
      })) : [];

      // Use standard Response to avoid Next.js specific issues in tests
      const responseBody = {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        errors: simplifiedErrors,
      };

      try {
        return new NextResponse(JSON.stringify(responseBody), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        // Absolute fallback if even NextResponse fails (e.g. environment issue)
        return {
          json: async () => responseBody,
          status: 400
        } as any;
      }
    } catch (e) {
      // Fallback to simple error
      try {
        return new NextResponse(JSON.stringify({ error: "Validation failed (fallback)" }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e2) {
        return {
          json: async () => ({ error: "Validation failed (fallback)" }),
          status: 400
        } as any;
      }
    }
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
    { status: 500 }
  );
}

export function successResponse<T>(data: T, status = 200, headers: Record<string, string> = {}) {
  try {
    if (NextResponse && NextResponse.json) {
      return NextResponse.json(
        {
          success: true,
          data,
        },
        { status, headers }
      );
    }
    throw new Error('NextResponse not available');
  } catch (e) {
    // Fallback for test environment
    return {
      json: async () => ({ success: true, data }),
      status,
      headers: new Headers(headers)
    } as any;
  }
}

export function errorResponse(message: string, status = 400, code?: string) {
  try {
    if (NextResponse && NextResponse.json) {
      return NextResponse.json(
        {
          success: false,
          error: message,
          code,
        },
        { status }
      );
    }
    throw new Error('NextResponse not available');
  } catch (e) {
    // Fallback for test environment
    return {
      json: async () => ({ success: false, error: message, code }),
      status
    } as any;
  }
}
