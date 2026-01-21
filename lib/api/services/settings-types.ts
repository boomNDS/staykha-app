import type { ApiResponse } from "@/lib/api/response";
import type { AdminSettings } from "@/lib/types";

export type SettingsResponse = ApiResponse<AdminSettings | null>;
export type SettingsUpdateResponse = ApiResponse<AdminSettings>;

export type SettingsUpdateRequest = Partial<AdminSettings>;
export type SettingsCreateRequest = Omit<AdminSettings, "teamId">;
