/**
 * Types for mapper function parameters
 */

import type {
  AdminInvitation,
  AdminSettings,
  Invoice,
  MeterReadingGroup,
  Room,
  Tenant,
  User,
} from "@/lib/types";
import type { RecordMeta } from "./pocketbase";

// Mapper input types (what PocketBase returns)
export type TeamMapperInput = RecordMeta & {
  name: string;
};

export type BuildingMapperInput = RecordMeta & {
  name: string;
  address: string;
  totalFloors?: number;
  totalRooms?: number;
  occupiedRooms?: number;
  ownerId?: string;
  teamId: string;
};

export type RoomMapperInput = RecordMeta & {
  roomNumber: string;
  buildingId: string;
  buildingName?: string;
  floor?: number;
  status?: Room["status"];
  size?: number;
  monthlyRent?: number;
  tenantId?: string | null;
  teamId: string;
};

export type TenantMapperInput = RecordMeta & {
  name: string;
  email: string;
  phone: string;
  roomId: string;
  moveInDate: string;
  monthlyRent: number;
  deposit: number;
  status: Tenant["status"];
  teamId: string;
};

export type ReadingGroupMapperInput = RecordMeta & {
  roomId: string;
  roomNumber?: string;
  tenantName?: string;
  readingDate: string;
  status: MeterReadingGroup["status"];
  water?: Record<string, unknown>;
  electric?: Record<string, unknown>;
  teamId: string;
};

export type InvoiceMapperInput = RecordMeta & {
  invoiceNumber?: string;
  tenantId?: string;
  roomId?: string;
  tenantName?: string;
  roomNumber?: string;
  billingPeriod?: string;
  issueDate?: string;
  dueDate?: string;
  status: Invoice["status"];
  waterUsage?: number;
  waterRate?: number;
  waterAmount?: number;
  electricUsage?: number;
  electricRate?: number;
  electricAmount?: number;
  subtotal?: number;
  tax?: number;
  total?: number;
  paidDate?: string | null;
  waterConsumption?: number;
  electricConsumption?: number;
  waterRatePerUnit?: number;
  electricRatePerUnit?: number;
  waterSubtotal?: number;
  electricSubtotal?: number;
  waterBillingMode?: "metered" | "fixed";
  waterFixedFee?: number;
  teamId: string;
};

export type SettingsMapperInput = RecordMeta &
  AdminSettings & {
    teamId: string;
  };

export type UserMapperInput = RecordMeta & {
  email: string;
  name?: string;
  role?: User["role"];
  teamId?: string;
};

export type InvitationMapperInput = RecordMeta & {
  email: string;
  teamId: string;
  invitedBy: string;
  invitedByName: string;
  status: AdminInvitation["status"];
  inviteCode: string;
  expiresAt: string;
  buildings?: string[];
};
