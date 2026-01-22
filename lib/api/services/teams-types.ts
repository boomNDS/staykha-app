import type { ApiListResponse, ApiResponse, OkResponse } from "@/lib/api/response";
import type { Team } from "@/lib/types";

export type TeamsListResponse = ApiListResponse<Team>;
export type TeamResponse = ApiResponse<Team>;
// Direct team response (not wrapped in ApiResponse)
export type TeamDirectResponse = Team;

export type TeamCreateRequest = Omit<Team, "id" | "createdAt" | "updatedAt">;
export type TeamUpdateRequest = Partial<Team>;
export type TeamDeleteResponse = OkResponse;
