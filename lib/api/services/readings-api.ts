import { BaseApiService } from "../base-service";
import type { MeterReadingGroup } from "@/lib/types";
import type {
  CreateReadingData,
  ReadingResponse,
  ReadingUpdateRequest,
  ReadingsListResponse,
} from "./readings-types";

class ReadingsApi extends BaseApiService {
  async getAll(token?: string): Promise<ReadingsListResponse> {
    try {
      const api = this.createApi(token);
      return api.get<ReadingsListResponse>("/readings");
    } catch (error: unknown) {
      this.handleError(error, "getAll");
    }
  }

  async getById(id: string, token?: string): Promise<ReadingResponse> {
    try {
      const api = this.createApi(token);
      return api.get<ReadingResponse>(`/readings/${id}`);
    } catch (error: unknown) {
      this.handleError(error, "getById", { id });
    }
  }

  async getByRoomDate(
    roomId: string,
    readingDate: string,
    token?: string,
  ): Promise<{ reading: MeterReadingGroup | null }> {
    try {
      const api = this.createApi(token);
      const response = await api.get<ReadingResponse | ReadingsListResponse>(
        "/readings",
        {
          params: { roomId, readingDate },
        },
      );
      const data = response as Record<string, unknown>;
      const reading = (data.reading ??
        data.item ??
        data.data ??
        data.result) as MeterReadingGroup | null | undefined;
      if (reading && typeof reading === "object") {
        return { reading };
      }
      const list =
        (data.readings as MeterReadingGroup[] | undefined) ??
        (data.items as MeterReadingGroup[] | undefined) ??
        (data.data as MeterReadingGroup[] | undefined) ??
        (data.results as MeterReadingGroup[] | undefined) ??
        [];
      return { reading: list[0] ?? null };
    } catch (error: unknown) {
      this.handleError(error, "getByRoomDate", { roomId, readingDate });
    }
  }

  async create(
    data: CreateReadingData,
    token?: string,
  ): Promise<ReadingResponse> {
    try {
      const api = this.createApi(token);
      return api.post<ReadingResponse>("/readings", data);
    } catch (error: unknown) {
      this.handleError(error, "create", { roomId: data.roomId });
    }
  }

  async update(
    id: string,
    updates: ReadingUpdateRequest,
    token?: string,
  ): Promise<ReadingResponse> {
    try {
      const api = this.createApi(token);
      return api.patch<ReadingResponse>(`/readings/${id}`, updates);
    } catch (error: unknown) {
      this.handleError(error, "update", { id });
    }
  }
}

export const readingsApi = new ReadingsApi();
