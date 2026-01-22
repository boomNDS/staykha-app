import type { OkResponse } from "@/lib/api/response";
import type { User } from "@/lib/types";

export interface AdminsListResponse {
  admins: User[];
}

export type AdminDeleteResponse = OkResponse;
