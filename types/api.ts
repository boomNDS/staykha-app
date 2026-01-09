/**
 * API request and response types
 */

import type { User } from "@/lib/types"

// Auth API response types
export type LoginResponse = {
  token: string
  record: {
    id: string
    email: string
    name?: string
    role?: User["role"]
  }
}

export type RegisterResponse = {
  id: string
  email: string
  name?: string
  role?: User["role"]
}

// Room API request types
export type CreateRoomData = {
  roomNumber: string
  buildingId: string
  floor: number
  status: "occupied" | "vacant" | "maintenance"
  monthlyRent?: number
  size?: number
}

export type BulkCreateRoomsData = {
  buildingId: string
  floorStart: number
  floorEnd: number
  roomsPerFloor: number
  startIndex: number
  status: "occupied" | "vacant" | "maintenance"
  monthlyRent?: number
  size?: number
}

// Reading API request types
export type CreateReadingData = {
  roomId: string
  readingDate: string
  water?: Record<string, unknown>
  electric?: Record<string, unknown>
}

// Invitation API request types
export type CreateInvitationData = {
  email: string
  name: string
  teamId: string
  message?: string
}
