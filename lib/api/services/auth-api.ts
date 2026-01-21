import { BaseApiService } from "../base-service";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "./auth-types";

class AuthApi extends BaseApiService {
  async login(
    email: string,
    password: string,
  ): Promise<LoginResponse> {
    try {
      const api = this.createApi(null); // No token for auth endpoints
      return api.post<LoginResponse>("/auth/login", {
        email,
        password,
      } satisfies LoginRequest);
    } catch (error: unknown) {
      this.handleError(error, "login", { email });
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
      const api = this.createApi(null); // No token for auth endpoints
      return api.post<RegisterResponse>("/auth/register", {
        email,
        password,
        passwordConfirm,
        name,
        role: role || "admin",
      } satisfies RegisterRequest);
    } catch (error: unknown) {
      this.handleError(error, "register", { email, role });
    }
  }

  async requestPasswordReset(email: string): Promise<unknown> {
    try {
      const api = this.createApi(null); // No token for auth endpoints
      return api.post("/auth/request-password-reset", { email });
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
      const api = this.createApi(null); // No token for auth endpoints
      return api.post("/auth/confirm-password-reset", {
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
      const api = this.createApi(null); // No token for auth endpoints
      return api.post("/auth/verify-email", { token });
    } catch (error: unknown) {
      this.handleError(error, "verifyEmail");
    }
  }
}

export const authApi = new AuthApi();
