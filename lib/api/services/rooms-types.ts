import type { ApiListResponse, ApiResponse, OkResponse } from "@/lib/api/response";
import type { Room } from "@/lib/types";

export type RoomsListResponse = ApiListResponse<Room>;
export type RoomResponse = ApiResponse<Room>;
export type RoomDeleteResponse = ApiResponse<OkResponse>;

export type CreateRoomData = {
  roomNumber: string;
  buildingId: string;
  floor: number;
  status?: "OCCUPIED" | "VACANT" | "MAINTENANCE"; // Optional, defaults to "VACANT" on backend
  monthlyRent?: number;
  size?: number;
};

export type RoomUpdateRequest = Partial<CreateRoomData> & {
  tenantId?: string | null;
};

export type BulkCreateRoomsData = {
  buildingId: string;
  floorStart: number;
  floorEnd: number;
  roomsPerFloor: number;
  startIndex: number;
  status?: "OCCUPIED" | "VACANT" | "MAINTENANCE"; // Optional, defaults to "VACANT" on backend
  monthlyRent?: number;
  size?: number;
};

export interface BulkCreateRoomsResponse {
  createdCount: number;
  skippedRooms: string[];
  rooms: Room[];
}

export type BulkCreateRoomsWrappedResponse = ApiResponse<BulkCreateRoomsResponse>;
