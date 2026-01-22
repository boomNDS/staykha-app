import type { ApiListResponse, ApiResponse, OkResponse } from "@/lib/api/response";
import type { Building } from "@/lib/types";

// Direct array response (not wrapped)
export type BuildingsDirectListResponse = Building[];
// Direct building response (not wrapped)
export type BuildingDirectResponse = Building;
export type BuildingsListResponse = ApiListResponse<Building>;
export type BuildingResponse = ApiResponse<Building>;

export type BuildingCreateRequest = Omit<Building, "id" | "createdAt" | "updatedAt">;
export type BuildingUpdateRequest = Partial<Building>;
export type BuildingDeleteResponse = OkResponse;
