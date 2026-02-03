import type { ApiListResponse, ApiResponse, OkResponse } from "@/lib/api/response";
import type { Tenant } from "@/lib/types";

export type TenantsListResponse = ApiListResponse<Tenant>;
export type TenantResponse = ApiResponse<Tenant>;
export type TenantDeleteResponse = ApiResponse<OkResponse>;

export type TenantCreateRequest = Omit<Tenant, "id">;
export type TenantUpdateRequest = Partial<Tenant>;
