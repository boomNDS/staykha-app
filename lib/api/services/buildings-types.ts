import type { ApiListResponse, ApiResponse, OkResponse } from "@/lib/api/response";
import type { Building } from "@/lib/types";

export type BuildingsListResponse = ApiListResponse<Building>;
export type BuildingResponse = ApiResponse<Building>;

export type BuildingCreateRequest = Omit<Building, "id" | "createdAt" | "updatedAt">;
export type BuildingUpdateRequest = Partial<Building>;
export type BuildingDeleteResponse = ApiResponse<OkResponse>;
