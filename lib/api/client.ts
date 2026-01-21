/**
 * Unified API Client
 * Single factory function that handles both authenticated and public requests
 */

import { FetchError, ofetch } from "ofetch";
import { getApiUrl } from "../env";
import { handleApiError } from "./error-handler";

const apiUrl = getApiUrl();
const apiBasePath = `${apiUrl}/v1`;

type RequestOptions = { body?: unknown; headers?: HeadersInit };

const attachJsonHeaders = (options: RequestOptions) => {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !isFormData) {
    const headers = options.headers ?? {};
    options.headers = {
      ...headers,
      "content-type": "application/json",
    };
  }
};

/**
 * Create a unified API instance that handles both authenticated and public requests
 * @param token - Optional token. If undefined, tries to get from localStorage. If null, no token is added.
 * @returns API instance with get, post, put, patch, delete methods
 */
export function createApi(token?: string | null) {
  // If token not provided, try to get from localStorage (for convenience)
  // If explicitly null, don't add token (for public endpoints)
  const authToken =
    token === undefined
      ? typeof window !== "undefined"
        ? window.localStorage.getItem("token")
        : null
      : token;

  // Create ofetch instance with token handling
  const fetchInstance = ofetch.create({
    baseURL: apiBasePath,
    credentials: "omit",
    headers: {
      accept: "application/json",
    },
    onRequest({ options }) {
      // Add token to headers if available
      if (authToken) {
        const headers = options.headers
          ? (options.headers as unknown as Record<string, string>)
          : {};
        (options.headers as any) = {
          ...headers,
          Authorization: `Bearer ${authToken}`,
        };
      }
      attachJsonHeaders(options as RequestOptions);
    },
    onResponseError({ response }) {
      if (import.meta.env.DEV) {
        console.error(
          `[API Error] ${response.status} ${response.statusText}`,
          response._data,
        );
      }
    },
  });

  type ApiOptions = Omit<
    Parameters<typeof fetchInstance>[1],
    "method" | "body"
  > & {
    body?: Record<string, unknown> | FormData | string | null;
    params?: Record<string, string | number | boolean | undefined>;
    responseType?: "json" | "blob" | "text";
  } & {
    // Override responseType to allow blob
    responseType?: "json" | "blob" | "text";
  };

  const withMethod = (
    method: "POST" | "PUT" | "PATCH" | "DELETE",
    options?: ApiOptions,
    body?: unknown,
  ) => {
    const { params, responseType, ...restOptions } = options ?? {};
    return {
      ...restOptions,
      method,
      ...(body !== undefined ? { body } : {}),
      ...(params ? { query: params } : {}),
      ...(responseType ? { responseType } : {}),
    };
  };

  return {
    get: async <T>(endpoint: string, options?: ApiOptions): Promise<T> => {
      try {
        const { params, responseType, ...restOptions } = options ?? {};
        return await fetchInstance<T>(
          endpoint,
          {
            ...restOptions,
            ...(params ? { query: params } : {}),
            ...(responseType ? { responseType } : {}),
          } as any,
        );
      } catch (error) {
        throw handleApiError(error);
      }
    },
    post: async <T>(
      endpoint: string,
      body?: unknown,
      options?: ApiOptions,
    ): Promise<T> => {
      try {
        return await fetchInstance<T>(
          endpoint,
          withMethod("POST", options, body) as any,
        );
      } catch (error) {
        throw handleApiError(error);
      }
    },
    put: async <T>(
      endpoint: string,
      body?: unknown,
      options?: ApiOptions,
    ): Promise<T> => {
      try {
        return await fetchInstance<T>(
          endpoint,
          withMethod("PUT", options, body) as any,
        );
      } catch (error) {
        throw handleApiError(error);
      }
    },
    patch: async <T>(
      endpoint: string,
      body?: unknown,
      options?: ApiOptions,
    ): Promise<T> => {
      try {
        return await fetchInstance<T>(
          endpoint,
          withMethod("PATCH", options, body) as any,
        );
      } catch (error) {
        throw handleApiError(error);
      }
    },
    delete: async <T>(endpoint: string, options?: ApiOptions): Promise<T> => {
      try {
        return await fetchInstance<T>(
          endpoint,
          withMethod("DELETE", options) as any,
        );
      } catch (error) {
        throw handleApiError(error);
      }
    },
  };
}

// Export FetchError for backward compatibility
export { FetchError };

// Legacy exports for backward compatibility during migration
// These will be removed after all services are migrated
export const apiFetch = ofetch.create({
  baseURL: apiBasePath,
  credentials: "omit",
  headers: {
    accept: "application/json",
  },
  onRequest({ options }) {
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("token");
      if (token) {
        const headers = options.headers
          ? (options.headers as unknown as Record<string, string>)
          : {};
        const newHeaders = {
          ...headers,
          Authorization: `Bearer ${token}`,
        };
        (options as any).headers = newHeaders;
      }
    }
    attachJsonHeaders(options as RequestOptions);
  },
  onResponseError({ response }) {
    if (import.meta.env.DEV) {
      console.error(
        `[API Error] ${response.status} ${response.statusText}`,
        response._data,
      );
    }
  },
});

export const authFetch = ofetch.create({
  baseURL: `${apiBasePath}/auth`,
  credentials: "omit",
  headers: {
    accept: "application/json",
  },
  onRequest({ options }) {
    attachJsonHeaders(options as RequestOptions);
  },
  onResponseError({ response }) {
    if (import.meta.env.DEV) {
      console.error(
        `[Auth Error] ${response.status} ${response.statusText}`,
        response._data,
      );
    }
  },
});

type FetchOptions = Parameters<typeof apiFetch>[1];
type LegacyApiOptions = Omit<FetchOptions, "method" | "body"> & {
  body?: Record<string, unknown> | FormData | string | null | unknown;
};

const withMethod = (
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  options?: LegacyApiOptions,
  body?: unknown,
) => ({
  ...(options ?? {}),
  method,
  ...(body !== undefined ? { body } : {}),
});

export const api = {
  get: <T>(url: string, options?: LegacyApiOptions) =>
    apiFetch<T>(url, options as any),
  post: <T>(url: string, body?: unknown, options?: LegacyApiOptions) =>
    apiFetch<T>(url, withMethod("POST", options, body) as any),
  put: <T>(url: string, body?: unknown, options?: LegacyApiOptions) =>
    apiFetch<T>(url, withMethod("PUT", options, body) as any),
  patch: <T>(url: string, body?: unknown, options?: LegacyApiOptions) =>
    apiFetch<T>(url, withMethod("PATCH", options, body) as any),
  del: <T>(url: string, options?: LegacyApiOptions) =>
    apiFetch<T>(url, withMethod("DELETE", options) as any),
};

export const auth = {
  get: <T>(url: string, options?: LegacyApiOptions) =>
    authFetch<T>(url, options as any),
  post: <T>(url: string, body?: unknown, options?: LegacyApiOptions) =>
    authFetch<T>(url, withMethod("POST", options, body) as any),
  put: <T>(url: string, body?: unknown, options?: LegacyApiOptions) =>
    authFetch<T>(url, withMethod("PUT", options, body) as any),
  patch: <T>(url: string, body?: unknown, options?: LegacyApiOptions) =>
    authFetch<T>(url, withMethod("PATCH", options, body) as any),
  del: <T>(url: string, options?: LegacyApiOptions) =>
    authFetch<T>(url, withMethod("DELETE", options) as any),
};
