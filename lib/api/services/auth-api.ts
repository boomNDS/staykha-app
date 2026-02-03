import { FetchError, ofetch } from "ofetch";
import { getApiUrl } from "../../env";
import { handleApiError } from "../error-handler";
import { getData } from "../response-helpers";
import type { ApiResponse } from "../response";
import type { Team, User } from "@/lib/types";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "./auth-types";

const apiUrl = getApiUrl();
const authBasePath = `${apiUrl}/auth`;

/**
 * Create an API instance for auth endpoints (uses /auth instead of /v1/auth)
 * @param token - Optional token. If undefined or null, no token is added.
 * @returns API instance with get, post, put, patch, delete methods
 */
function createAuthApi(token?: string | null) {
  const fetchInstance = ofetch.create({
    baseURL: authBasePath,
    credentials: "omit",
    headers: {
      accept: "application/json",
    },
    onRequest({ options }) {
      if (token) {
        const headers = options.headers
          ? (options.headers as unknown as Record<string, string>)
          : {};
        (options.headers as any) = {
          ...headers,
          Authorization: `Bearer ${token}`,
        };
      }
      // Attach JSON headers if body exists
      const isFormData =
        typeof FormData !== "undefined" && options.body instanceof FormData;
      if (options.body && !isFormData) {
        const headers = options.headers ?? {};
        (options.headers as any) = {
          ...headers,
          "content-type": "application/json",
        };
      }
    },
    onResponseError({ response }) {
      if (import.meta.env.DEV) {
        console.error(
          `[Auth API Error] ${response.status} ${response.statusText}`,
          response._data,
        );
      }
    },
  });

  return {
    get: <T>(url: string, options?: { params?: Record<string, unknown> }) =>
      fetchInstance<T>(url, {
        method: "GET",
        ...options,
      }),
    post: <T>(url: string, body?: unknown) =>
      fetchInstance<T>(url, {
        method: "POST",
        body: body as any,
      }),
    put: <T>(url: string, body?: unknown) =>
      fetchInstance<T>(url, {
        method: "PUT",
        body: body as any,
      }),
    patch: <T>(url: string, body?: unknown) =>
      fetchInstance<T>(url, {
        method: "PATCH",
        body: body as any,
      }),
    delete: <T>(url: string) =>
      fetchInstance<T>(url, {
        method: "DELETE",
      }),
  };
}

class AuthApi {
  private handleError(error: unknown, method: string, context?: Record<string, unknown>) {
    const apiError = handleApiError(error);
    if (import.meta.env.DEV) {
      console.error(`[AuthApi.${method}]`, context, apiError);
    }
    throw apiError;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      const api = createAuthApi(null); // No token for auth endpoints
      const response = await api.post<ApiResponse<LoginResponse>>("/login", {
        email,
        password,
      } satisfies LoginRequest);
      
      if (import.meta.env.DEV) {
        console.log("[AuthApi.login] Raw response:", response);
      }
      
      const loginData = getData(response);
      
      if (import.meta.env.DEV) {
        console.log("[AuthApi.login] Processed login data:", loginData);
      }
      
      if (!loginData || !loginData.accessToken || !loginData.user) {
        console.error("[AuthApi.login] Invalid response structure:", { response, loginData });
        throw new Error("Invalid login response structure");
      }
      
      // If userRecord is null, extract user info from Supabase user object
      // Otherwise use userRecord (Prisma user data)
      let user: User;
      
      if (loginData.userRecord) {
        // Use userRecord if available (preferred - has Prisma data)
        const role = loginData.userRecord.role?.toLowerCase() === "admin" 
          ? "admin" 
          : loginData.userRecord.role?.toLowerCase() === "owner"
          ? "owner"
          : (loginData.user?.app_metadata?.role?.toLowerCase() as "owner" | "admin") || "admin";
        
        user = {
          id: loginData.userRecord.id,
          email: loginData.userRecord.email,
          name: loginData.userRecord.name,
          role,
          teamId: loginData.userRecord.teamId || undefined,
          team: loginData.team || undefined,
          createdAt: loginData.userRecord.createdAt,
        };
      } else {
        // Fallback to Supabase user data if userRecord is null
        // Try to infer role from app_metadata, or from email pattern
        let role: "owner" | "admin" = "admin";
        
        if (loginData.user?.app_metadata?.role) {
          const metadataRole = loginData.user.app_metadata.role.toLowerCase();
          role = metadataRole === "owner" ? "owner" : "admin";
        } else {
          // Infer role from email if app_metadata.role is not set
          const email = loginData.user?.email?.toLowerCase() || "";
          if (email.startsWith("owner@")) {
            // Default to owner for emails starting with "owner@"
            role = "owner";
          } else if (email.startsWith("admin@")) {
            // Default to admin for emails starting with "admin@"
            role = "admin";
          }
        }
        
        const name = loginData.user?.user_metadata?.name || loginData.user?.email || "";
        
        // Use Supabase user data when userRecord is null
        // User should register/signup first to create user record
        user = {
          id: loginData.user.id,
          email: loginData.user.email,
          name,
          role,
          teamId: undefined,
          team: loginData.team || undefined,
          createdAt: loginData.user.created_at,
        };
      }
      
      return {
        user,
        token: loginData.accessToken,
        refreshToken: loginData.refreshToken,
      };
    } catch (error: unknown) {
      this.handleError(error, "login", { email });
      throw error; // handleError throws, but TypeScript needs this
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - The refresh token
   * @returns New access token and refresh token
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const api = createAuthApi(null); // No token for auth endpoints
      const response = await api.post<{
        accessToken: string;
        refreshToken: string;
      }>("/refresh", {
        refreshToken,
      });
      
      if (!response || !response.accessToken || !response.refreshToken) {
        throw new Error("Invalid refresh response structure");
      }
      
      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };
    } catch (error: unknown) {
      this.handleError(error, "refresh");
      throw error;
    }
  }

  /**
   * Get current authenticated user info
   * @param token - Access token
   * @returns User data with fresh token if refreshed
   */
  async getMe(token: string): Promise<{ user: User; token?: string }> {
    try {
      const api = createAuthApi(token);
      const response = await api.get<ApiResponse<{
        id: string;
        email: string;
        name: string;
        role: "OWNER" | "ADMIN";
        team: Team | null;
      }>>("/me");
      
      const meData = getData(response);
      
      if (!meData || !meData.id || !meData.email) {
        throw new Error("Invalid /auth/me response structure");
      }
      
      // Map role from "OWNER" | "ADMIN" to "owner" | "admin"
      const role = meData.role?.toLowerCase() === "admin" 
        ? "admin" 
        : meData.role?.toLowerCase() === "owner"
        ? "owner"
        : "admin";
      
      const user: User = {
        id: meData.id,
        email: meData.email,
        name: meData.name,
        role,
        teamId: meData.team?.id || undefined,
        team: meData.team || undefined,
      };
      
      return {
        user,
        // /auth/me doesn't return a new token, so we don't update it
      };
    } catch (error: unknown) {
      this.handleError(error, "getMe");
      throw error;
    }
  }

  async register(
    email: string,
    password: string,
    passwordConfirm: string,
    name?: string,
    role?: "owner" | "admin",
  ): Promise<RegisterResponse> {
    try {
      const api = createAuthApi(null); // No token for auth endpoints
      const rolePayload = (role ?? "admin").toUpperCase() as
        | "OWNER"
        | "ADMIN";
      const response = await api.post<ApiResponse<RegisterResponse>>("/register", {
        email,
        password,
        passwordConfirm,
        name,
        role: rolePayload,
      } satisfies RegisterRequest);
      
      const registerData = getData(response);
      if (!registerData) {
        throw new Error("Invalid register response structure");
      }
      return registerData;
    } catch (error: unknown) {
      this.handleError(error, "register", { email, role });
      return undefined as never; // handleError throws, this never executes
    }
  }

  async requestPasswordReset(email: string): Promise<unknown> {
    try {
      const api = createAuthApi(null); // No token for auth endpoints
      return api.post("/request-password-reset", { email });
    } catch (error: unknown) {
      this.handleError(error, "requestPasswordReset", { email });
    }
  }

  async confirmPasswordReset(
    token: string,
    password: string,
    passwordConfirm: string,
  ): Promise<unknown> {
    try {
      const api = createAuthApi(null); // No token for auth endpoints
      return api.post("/confirm-password-reset", {
        token,
        password,
        passwordConfirm,
      });
    } catch (error: unknown) {
      this.handleError(error, "confirmPasswordReset");
    }
  }

  async verifyEmail(token: string): Promise<unknown> {
    try {
      const api = createAuthApi(null); // No token for auth endpoints
      return api.post("/verify-email", { token });
    } catch (error: unknown) {
      this.handleError(error, "verifyEmail");
    }
  }
}

export const authApi = new AuthApi();
