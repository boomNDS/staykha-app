/**
 * Base class for API services
 * Provides common patterns for error handling and API instance creation
 */

import { createApi } from "./client";
import { getErrorMessage, logError } from "../error-utils";

export abstract class BaseApiService {
  /**
   * Create API instance with optional token
   * @param token - Optional token. If undefined, gets from localStorage. If null, no token.
   */
  protected createApi(token?: string | null) {
    return createApi(token);
  }

  /**
   * Handle errors with logging and throw typed error
   * @param error - The error to handle
   * @param action - The action that failed (e.g., 'getAll', 'create')
   * @param metadata - Additional metadata for logging
   */
  protected handleError(
    error: unknown,
    action: string,
    metadata?: Record<string, unknown>,
  ): never {
    const scope = this.constructor.name;
    logError(error, { scope, action, metadata });
    const message = getErrorMessage(error, `Failed to ${action}`);
    throw new Error(message);
  }
}
