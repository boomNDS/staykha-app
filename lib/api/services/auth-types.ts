import type { Team, User } from "@/lib/types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    aud: string;
    role: string;
    email: string;
    email_confirmed_at?: string;
    phone?: string;
    confirmed_at?: string;
    last_sign_in_at?: string;
    app_metadata?: {
      provider?: string;
      providers?: string[];
      role?: string;
    };
    user_metadata?: {
      email_verified?: boolean;
      name?: string;
    };
    identities?: unknown[];
    created_at?: string;
    updated_at?: string;
    is_anonymous?: boolean;
  };
  userRecord: {
    id: string;
    email: string;
    name: string;
    role: string; // "ADMIN" or "OWNER" from backend
    teamId?: string | null;
    createdAt?: string;
  } | null; // Can be null if user doesn't exist in Prisma yet
  team: Team | null; // Team object if user has team, null otherwise
}

export interface RegisterRequest {
  email: string;
  password: string;
  passwordConfirm: string;
  name?: string;
  role?: "OWNER" | "ADMIN";
}

export interface RegisterResponse {
  user: User;
}
