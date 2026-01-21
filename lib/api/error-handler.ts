/**
 * Error transformation and handling utilities
 */

import { FetchError } from "ofetch";
import {
  ApiError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./errors";
import { getErrorMessage } from "../error-utils";

/**
 * Transform fetch errors into typed API errors
 */
export function handleApiError(error: unknown): ApiError {
  if (error instanceof FetchError) {
    const status = error.status || error.response?.status;
    const message =
      error.data?.message ||
      error.message ||
      `API request failed with status ${status}`;

    switch (status) {
      case 401:
        return new UnauthorizedError(message, error);
      case 403:
        return new ForbiddenError(message, error);
      case 404:
        return new NotFoundError(message, error);
      case 400:
      case 422:
        // Validation errors
        const fieldErrors =
          typeof error.data === "object" && error.data !== null
            ? (error.data as { fieldErrors?: Record<string, string> })
                .fieldErrors
            : undefined;
        return new ValidationError(message, fieldErrors, error);
      default:
        return new ApiError(message, error, status);
    }
  }

  if (error instanceof Error) {
    // Network errors or other errors
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return new NetworkError(error.message, error);
    }
    return new ApiError(error.message, error);
  }

  // Unknown error type
  const message = getErrorMessage(error, "An unknown error occurred");
  return new ApiError(message, error);
}
