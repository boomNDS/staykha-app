import type { ApiResponse } from "@/lib/api/response";
import type { User } from "@/lib/types";

export type UserUpdateRequest = Partial<User>;
export type UserResponse = ApiResponse<User>;
