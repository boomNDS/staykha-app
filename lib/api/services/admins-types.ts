import type { ApiListResponse, ApiResponse, OkResponse } from "@/lib/api/response";
import type { User } from "@/lib/types";

export type AdminsListResponse = ApiListResponse<User>;

export type AdminDeleteResponse = ApiResponse<OkResponse>;
