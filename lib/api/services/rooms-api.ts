import { BaseApiService } from "../base-service";
import type { Room } from "@/lib/types";
import type {
  BulkCreateRoomsData,
  BulkCreateRoomsResponse,
  CreateRoomData,
  RoomDeleteResponse,
  RoomDirectResponse,
  RoomResponse,
  RoomUpdateRequest,
  RoomsDirectListResponse,
} from "./rooms-types";

// Helper to map API response (uppercase status) to Room type (lowercase status)
function mapRoomFromApi(apiRoom: any): Room {
  return {
    ...apiRoom,
    status: (apiRoom.status?.toLowerCase() ?? "vacant") as
      | "occupied"
      | "vacant"
      | "maintenance",
    monthlyRent:
      typeof apiRoom.monthlyRent === "string"
        ? Number.parseFloat(apiRoom.monthlyRent)
        : apiRoom.monthlyRent,
    size:
      typeof apiRoom.size === "string"
        ? Number.parseFloat(apiRoom.size)
        : apiRoom.size,
    // Preserve tenant data if present in API response
    tenant: apiRoom.tenant
      ? {
          id: apiRoom.tenant.id,
          name: apiRoom.tenant.name,
          email: apiRoom.tenant.email,
        }
      : null,
  };
}

class RoomsApi extends BaseApiService {
  async getAll(token?: string): Promise<RoomsDirectListResponse> {
    try {
      const api = this.createApi(token);
      const response = await api.get<any[]>("/rooms");
      return response.map(mapRoomFromApi);
    } catch (error: unknown) {
      this.handleError(error, "getAll");
    }
  }

  async getById(id: string, token?: string): Promise<RoomDirectResponse> {
    try {
      const api = this.createApi(token);
      const response = await api.get<any>(`/rooms/${id}`);
      return mapRoomFromApi(response);
    } catch (error: unknown) {
      this.handleError(error, "getById", { id });
    }
  }

  async create(data: CreateRoomData, token?: string): Promise<RoomDirectResponse> {
    try {
      const api = this.createApi(token);
      const response = await api.post<any>("/rooms", data);
      return mapRoomFromApi(response);
    } catch (error: unknown) {
      this.handleError(error, "create", { roomNumber: data.roomNumber });
    }
  }

  async update(
    id: string,
    data: RoomUpdateRequest,
    token?: string,
  ): Promise<RoomDirectResponse> {
    try {
      const api = this.createApi(token);
      const response = await api.patch<any>(`/rooms/${id}`, data);
      return mapRoomFromApi(response);
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
      const response = await api.post<any>("/rooms/bulk", data);
      return {
        ...response,
        rooms: response.rooms?.map(mapRoomFromApi) ?? [],
      };
    } catch (error: unknown) {
      this.handleError(error, "bulkCreate", {
        buildingId: data.buildingId,
      });
    }
  }
}

export const roomsApi = new RoomsApi();
