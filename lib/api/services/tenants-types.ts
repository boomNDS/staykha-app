import type { ApiListResponse, ApiResponse, OkResponse } from "@/lib/api/response";
import type { Tenant } from "@/lib/types";

// Direct array response (not wrapped)
export type TenantsDirectListResponse = Tenant[];
// Direct tenant response (not wrapped)
export type TenantDirectResponse = Tenant;
export type TenantsListResponse = ApiListResponse<Tenant>;
export type TenantResponse = ApiResponse<Tenant>;
export type TenantDeleteResponse = OkResponse;

export type TenantCreateRequest = Omit<Tenant, "id">;
export type TenantUpdateRequest = Partial<Tenant>;
