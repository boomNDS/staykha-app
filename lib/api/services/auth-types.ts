import type { User } from "@/lib/types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  passwordConfirm: string;
  name?: string;
  role?: "owner" | "admin";
}

export interface RegisterResponse {
  user: User;
}
