/**
 * API Error types and classes
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public originalError?: unknown,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "ApiError";
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

export class NetworkError extends ApiError {
  constructor(message: string, originalError?: unknown) {
    super(message, originalError);
    this.name = "NetworkError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", originalError?: unknown) {
    super(message, originalError, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden", originalError?: unknown) {
    super(message, originalError, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not Found", originalError?: unknown) {
    super(message, originalError, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public fieldErrors?: Record<string, string>,
    originalError?: unknown,
  ) {
    super(message, originalError, 400);
    this.name = "ValidationError";
  }
}
