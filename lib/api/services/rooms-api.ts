import { BaseApiService } from "../base-service";
import type { Room } from "@/lib/types";
import type {
  BulkCreateRoomsData,
  BulkCreateRoomsWrappedResponse,
  CreateRoomData,
  RoomDeleteResponse,
  RoomResponse,
  RoomUpdateRequest,
  RoomsListResponse,
} from "./rooms-types";
import { getData, getList } from "../response-helpers";

// Helper to map API response (uppercase status) to Room type (lowercase status)
function mapRoomFromApi(apiRoom: any): Room {
  return {
    ...apiRoom,
    buildingName: apiRoom.building?.name ?? apiRoom.buildingName ?? "",
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
  async getAll(token?: string): Promise<RoomsListResponse> {
    try {
      const api = this.createApi(token);
      const response = await api.get<RoomsListResponse>("/rooms");
      const rooms = getList(response).map(mapRoomFromApi);
      return { ...response, data: rooms };
    } catch (error: unknown) {
      this.handleError(error, "getAll");
    }
  }

  async getById(id: string, token?: string): Promise<RoomResponse> {
    try {
      const api = this.createApi(token);
      const response = await api.get<RoomResponse>(`/rooms/${id}`);
      const room = getData(response);
      return room ? { ...response, data: mapRoomFromApi(room) } : response;
    } catch (error: unknown) {
      this.handleError(error, "getById", { id });
    }
  }

  async create(data: CreateRoomData, token?: string): Promise<RoomResponse> {
    try {
      const api = this.createApi(token);
      const response = await api.post<RoomResponse>("/rooms", data);
      const room = getData(response);
      return room ? { ...response, data: mapRoomFromApi(room) } : response;
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
      const response = await api.patch<RoomResponse>(`/rooms/${id}`, data);
      const room = getData(response);
      return room ? { ...response, data: mapRoomFromApi(room) } : response;
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
  ): Promise<BulkCreateRoomsWrappedResponse> {
    try {
      const api = this.createApi(token);
      const response = await api.post<BulkCreateRoomsWrappedResponse>("/rooms/bulk", data);
      const payload = getData(response);
      if (!payload) {
        return response;
      }
      return {
        ...response,
        data: {
          ...payload,
          rooms: payload.rooms?.map(mapRoomFromApi) ?? [],
        },
      };
    } catch (error: unknown) {
      this.handleError(error, "bulkCreate", {
        buildingId: data.buildingId,
      });
    }
  }
}

export const roomsApi = new RoomsApi();
