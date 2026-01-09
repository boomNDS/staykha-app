/**
 * PocketBase collection record types (raw database records)
 */

import type {
  AdminInvitation,
  Invoice,
  InvoiceReading,
  MeterReadingGroup,
  Room,
  Tenant,
  User,
} from "@/lib/types";
import type { RecordMeta } from "./pocketbase";

// Team collection record type
export type TeamRecord = RecordMeta & {
  name: string;
};

// Building collection record type
export type BuildingRecord = RecordMeta & {
  name: string;
  address: string;
  totalFloors?: number;
  totalRooms?: number;
  occupiedRooms?: number;
  ownerId?: string;
  teamId: string;
};

// Room collection record type
export type RoomRecord = RecordMeta & {
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

// Tenant collection record type
export type TenantRecord = RecordMeta & {
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

// Reading group collection record type
export type ReadingGroupRecord = RecordMeta & {
  roomId: string;
  roomNumber?: string;
  tenantName?: string;
  readingDate: string;
  status: MeterReadingGroup["status"];
  water?: Record<string, unknown>;
  electric?: Record<string, unknown>;
  teamId: string;
};

// Invoice collection record type
export type InvoiceRecord = RecordMeta & {
  invoiceNumber?: string;
  tenantId?: string;
  roomId: string;
  tenantName?: string;
  roomNumber?: string;
  billingPeriod: string;
  issueDate: string;
  dueDate: string;
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
  readingGroupId?: string; // Link to reading group - ensures one invoice per reading group
  readings?: InvoiceReading[]; // JSON field storing meter reading details
};

// User collection record type (for admin management)
export type UserRecord = RecordMeta & {
  email: string;
  name?: string;
  role?: User["role"];
  teamId?: string;
};

// Admin invitation collection record type
export type AdminInvitationRecord = RecordMeta & {
  email: string;
  teamId: string;
  invitedBy: string;
  invitedByName: string;
  status: AdminInvitation["status"];
  inviteCode: string;
  expiresAt: string;
  buildings?: string[];
};

// Settings collection record type
export type SettingsRecord = RecordMeta & {
  teamId: string;
  waterRatePerUnit: number;
  waterBillingMode: "metered" | "fixed";
  waterFixedFee?: number;
  electricRatePerUnit: number;
  taxRate: number;
  currency: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  invoicePrefix: string;
  paymentTermsDays: number;
  defaultRoomRent?: number;
  defaultRoomSize?: number;
  // Payment & Billing Details
  bankName?: string;
  bankAccountNumber?: string;
  lineId?: string;
  latePaymentPenaltyPerDay?: number;
  dueDateDayOfMonth?: number;
  // Thai Labels
  labelRoomRent?: string;
  labelWater?: string;
  labelElectricity?: string;
  labelInvoice?: string;
};
