/**
 * Base custom error class for JobNest application.
 * Extends the standard Error class to incorporate HTTP status codes, operational markers, and error identifiers.
 */
export class AppError extends Error {
  public readonly isOperational: boolean;
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = "INTERNAL_SERVER_ERROR", isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly errors?: Record<string, string[]>;

  constructor(message: string, errors?: Record<string, string[]>) {
    super(message, 400, "VALIDATION_ERROR");
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication credentials invalid or missing.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Access forbidden. Insufficient permissions.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Requested resource not found.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class DatabaseError extends AppError {
  constructor(message = "A database error occurred.", rawError?: unknown) {
    super(message, 500, "DATABASE_ERROR", false);
    if (rawError) {
      this.cause = rawError;
    }
  }
}

export class IntegrationError extends AppError {
  constructor(message: string, serviceName: string, rawError?: unknown) {
    super(`Integration [${serviceName}] failed: ${message}`, 502, "BAD_GATEWAY", true);
    if (rawError) {
      this.cause = rawError;
    }
  }
}
