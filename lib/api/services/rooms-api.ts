import { BaseApiService } from "../base-service";
import type {
  BulkCreateRoomsData,
  BulkCreateRoomsResponse,
  CreateRoomData,
  RoomDeleteResponse,
  RoomResponse,
  RoomUpdateRequest,
  RoomsListResponse,
} from "./rooms-types";

class RoomsApi extends BaseApiService {
  async getAll(token?: string): Promise<RoomsListResponse> {
    try {
      const api = this.createApi(token);
      return api.get<RoomsListResponse>("/rooms");
    } catch (error: unknown) {
      this.handleError(error, "getAll");
    }
  }

  async getById(id: string, token?: string): Promise<RoomResponse> {
    try {
      const api = this.createApi(token);
      return api.get<RoomResponse>(`/rooms/${id}`);
    } catch (error: unknown) {
      this.handleError(error, "getById", { id });
    }
  }

  async create(data: CreateRoomData, token?: string): Promise<RoomResponse> {
    try {
      const api = this.createApi(token);
      return api.post<RoomResponse>("/rooms", data);
    } catch (error: unknown) {
      this.handleError(error, "create", { roomNumber: data.roomNumber });
    }
  }

  async update(
    id: string,
    data: RoomUpdateRequest,
    token?: string,
  ): Promise<RoomResponse> {
    try {
      const api = this.createApi(token);
      return api.patch<RoomResponse>(`/rooms/${id}`, data);
    } catch (error: unknown) {
      this.handleError(error, "update", { id });
    }
  }

  async remove(id: string, token?: string): Promise<RoomDeleteResponse> {
    try {
      const api = this.createApi(token);
      return api.delete<RoomDeleteResponse>(`/rooms/${id}`);
    } catch (error: unknown) {
      this.handleError(error, "remove", { id });
    }
  }

  async bulkCreate(
    data: BulkCreateRoomsData,
    token?: string,
  ): Promise<BulkCreateRoomsResponse> {
    try {
      const api = this.createApi(token);
      return api.post<BulkCreateRoomsResponse>("/rooms/bulk", data);
    } catch (error: unknown) {
      this.handleError(error, "bulkCreate", {
        buildingId: data.buildingId,
      });
    }
  }
}

export const roomsApi = new RoomsApi();
