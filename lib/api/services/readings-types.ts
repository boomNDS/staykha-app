import type { ApiListResponse, ApiResponse } from "@/lib/api/response";
import type { MeterReadingGroup } from "@/lib/types";

export type ReadingsListResponse = ApiListResponse<MeterReadingGroup>;
export type ReadingResponse = ApiResponse<MeterReadingGroup>;

export type CreateReadingData = {
  roomId: string;
  readingDate: string;
  water?: Record<string, unknown>;
  electric?: Record<string, unknown>;
};

export type ReadingUpdateRequest = Partial<MeterReadingGroup>;
