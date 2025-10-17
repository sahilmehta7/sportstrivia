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

export function handleError(error: unknown) {
  console.error("API Error:", error);

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

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error instanceof ValidationError && { errors: error.errors }),
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        errors: error.errors,
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message,
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

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function errorResponse(message: string, status = 400, code?: string) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status }
  );
}
