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
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = typeof window !== "undefined"
      ? window.localStorage.getItem("refreshToken")
      : null;
    
    if (!refreshToken) {
      return null;
    }

    const response = await fetch(`${getApiUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.accessToken && data.refreshToken) {
      // Update stored tokens
      if (typeof window !== "undefined") {
        window.localStorage.setItem("token", data.accessToken);
        window.localStorage.setItem("refreshToken", data.refreshToken);
      }
      return data.accessToken;
    }
    
    return null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("[API Client] Failed to refresh token:", error);
    }
    return null;
  }
}

/**
 * Create a unified API instance that handles both authenticated and public requests
 * @param token - Optional token. If undefined, tries to get from localStorage. If null, no token is added.
 * @returns API instance with get, post, put, patch, delete methods
 */
export function createApi(token?: string | null) {
  // If token not provided, try to get from localStorage (for convenience)
  // If explicitly null, don't add token (for public endpoints)
  let currentToken: string | null;
  const getAuthToken = () => {
    if (token === undefined) {
      currentToken = typeof window !== "undefined"
        ? window.localStorage.getItem("token")
        : null;
      return currentToken;
    }
    currentToken = token;
    return currentToken;
  };
  
  // Initialize current token
  getAuthToken();

  // Create ofetch instance with token handling and automatic refresh
  const fetchInstance = ofetch.create({
    baseURL: apiBasePath,
    credentials: "omit",
    headers: {
      accept: "application/json",
    },
    onRequest({ options }) {
      // Add token to headers if available (use currentToken which may be refreshed)
      const authToken = currentToken || getAuthToken();
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

      // If 401 Unauthorized, try to refresh token
      if (response.status === 401 && token !== null) {
        // Refresh token asynchronously (don't block the error)
        refreshAccessToken().then((newToken) => {
          if (!newToken && typeof window !== "undefined") {
            // Refresh failed, clear tokens and redirect to login
            window.localStorage.removeItem("token");
            window.localStorage.removeItem("refreshToken");
            window.localStorage.removeItem("user");
            window.location.assign("/login");
          }
        }).catch(() => {
          // Refresh failed, clear tokens and redirect to login
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("token");
            window.localStorage.removeItem("refreshToken");
            window.localStorage.removeItem("user");
            window.location.assign("/login");
          }
        });
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

  // Helper to retry request with new token after refresh
  const retryWithRefresh = async <T>(
    fn: () => Promise<T>,
    retries = 1,
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error: any) {
      // If 401 and we have retries left, try to refresh and retry
      if (error?.status === 401 && retries > 0 && token !== null) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Update the current token for subsequent requests
          currentToken = newToken;
          // Retry the request
          return retryWithRefresh(fn, retries - 1);
        } else {
          // Refresh failed, clear tokens and redirect to login
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("token");
            window.localStorage.removeItem("refreshToken");
            window.localStorage.removeItem("user");
            window.location.assign("/login");
          }
        }
      }
      throw error;
    }
  };

  return {
    get: async <T>(endpoint: string, options?: ApiOptions): Promise<T> => {
      try {
        const { params, responseType, ...restOptions } = options ?? {};
        return await retryWithRefresh(async () => {
          return await fetchInstance<T>(
            endpoint,
            {
              ...restOptions,
              ...(params ? { query: params } : {}),
              ...(responseType ? { responseType } : {}),
            } as any,
          );
        });
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
        return await retryWithRefresh(async () => {
          return await fetchInstance<T>(
            endpoint,
            withMethod("POST", options, body) as any,
          );
        });
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
        return await retryWithRefresh(async () => {
          return await fetchInstance<T>(
            endpoint,
            withMethod("PUT", options, body) as any,
          );
        });
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
        return await retryWithRefresh(async () => {
          return await fetchInstance<T>(
            endpoint,
            withMethod("PATCH", options, body) as any,
          );
        });
      } catch (error) {
        throw handleApiError(error);
      }
    },
    delete: async <T>(endpoint: string, options?: ApiOptions): Promise<T> => {
      try {
        return await retryWithRefresh(async () => {
          return await fetchInstance<T>(
            endpoint,
            withMethod("DELETE", options) as any,
          );
        });
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
