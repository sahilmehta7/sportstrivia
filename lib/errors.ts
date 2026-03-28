import { AttemptResetPeriod } from "@prisma/client";
import { ZodError } from "zod";

function safeJsonStringify(body: unknown): string {
  try {
    return JSON.stringify(body);
  } catch {
    return JSON.stringify({
      error: "Failed to serialize response body",
      code: "SERIALIZATION_ERROR",
    });
  }
}

class TestHeaders {
  private readonly values = new Map<string, string>();

  constructor(init?: Record<string, string>) {
    if (!init) return;
    for (const [key, value] of Object.entries(init)) {
      this.values.set(key.toLowerCase(), value);
    }
  }

  get(name: string): string | null {
    return this.values.get(name.toLowerCase()) ?? null;
  }
}

class TestResponse {
  public readonly status: number;
  public readonly headers: TestHeaders;
  private readonly bodyText: string;

  constructor(bodyText: string, status: number, headers: Record<string, string>) {
    this.bodyText = bodyText;
    this.status = status;
    this.headers = new TestHeaders(headers);
  }

  async json() {
    return JSON.parse(this.bodyText);
  }

  async text() {
    return this.bodyText;
  }
}

function buildJsonResponse(
  body: unknown,
  status: number,
  headers: Record<string, string> = {}
) {
  const bodyText = safeJsonStringify(body);
  const responseHeaders = {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  };

  if (typeof Response !== "undefined") {
    return new Response(bodyText, {
      status,
      headers: responseHeaders,
    });
  }

  return new TestResponse(bodyText, status, responseHeaders) as any;
}

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

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable") {
    super(503, message, "SERVICE_UNAVAILABLE");
  }
}

function sanitizeErrorForLogging(error: unknown): string {
  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = String(error);
  }

  return message
    .replace(/password[=:]\s*["']?[^\s"']+["']?/gi, "password=[REDACTED]")
    .replace(/token[=:]\s*["']?[^\s"']+["']?/gi, "token=[REDACTED]")
    .replace(/key[=:]\s*["']?[^\s"']+["']?/gi, "key=[REDACTED]")
    .replace(/secret[=:]\s*["']?[^\s"']+["']?/gi, "secret=[REDACTED]")
    .replace(/bearer\s+[^\s]+/gi, "Bearer [REDACTED]")
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]")
    .replace(/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g, "[CARD]");
}

export function handleError(error: unknown) {
  if (error instanceof AttemptLimitError) {
    return buildJsonResponse(
      {
        error: error.message,
        code: error.code,
        limit: error.limit,
        period: error.period,
        resetAt: error.resetAt ? error.resetAt.toISOString() : null,
      },
      error.statusCode
    );
  }

  const isAppError =
    error instanceof AppError ||
    (typeof error === "object" &&
      error !== null &&
      ("statusCode" in error || "code" in error) &&
      "message" in error);

  if (isAppError) {
    const appError = error as any;
    const statusCode = appError.statusCode || 400;

    if (statusCode >= 500) {
      console.error("API Error:", sanitizeErrorForLogging(error));
    }

    return buildJsonResponse(
      {
        error: appError.message,
        code: appError.code || "APP_ERROR",
        ...(appError.errors && { errors: appError.errors }),
      },
      statusCode
    );
  }

  const isZodError =
    error instanceof ZodError ||
    (error as any)?.name === "ZodError" ||
    (error as any)?.constructor?.name === "ZodError" ||
    (Array.isArray((error as any)?.errors) && (error as any)?.issues);

  if (isZodError) {
    try {
      const zodErrors = (error as any).errors || (error as any).issues || [];
      const simplifiedErrors = Array.isArray(zodErrors)
        ? zodErrors.map((issue: any) => ({
            code: issue.code,
            message: issue.message,
            path: issue.path,
          }))
        : [];

      return buildJsonResponse(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          errors: simplifiedErrors,
        },
        400
      );
    } catch {
      return buildJsonResponse({ error: "Validation failed (fallback)" }, 400);
    }
  }

  if (error instanceof Error) {
    console.error("API Error:", sanitizeErrorForLogging(error));
    return buildJsonResponse(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      500
    );
  }

  console.error("API Error:", sanitizeErrorForLogging(error));
  return buildJsonResponse(
    {
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
    500
  );
}

export function successResponse<T>(data: T, status = 200, headers: Record<string, string> = {}) {
  return buildJsonResponse(
    {
      success: true,
      data,
    },
    status,
    headers
  );
}

export function errorResponse(message: string, status = 400, code?: string) {
  return buildJsonResponse(
    {
      success: false,
      error: message,
      code,
    },
    status
  );
}
