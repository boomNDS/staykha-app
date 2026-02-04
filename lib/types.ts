// TypeScript type definitions for the dormitory meter billing system

export enum TenantStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  EXPIRED = "EXPIRED",
}

export enum WaterBillingMode {
  METERED = "METERED",
  FIXED = "FIXED",
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  PAID = "PAID",
  PENDING = "PENDING",
  OVERDUE = "OVERDUE",
}

export interface Team {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin";
  teamId?: string;
  team?: Team;
  createdAt?: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  totalFloors: number;
  totalRooms: number;
  occupiedRooms: number;
  ownerId: string;
  teamId: string;
  team?: Team;
  createdAt: string;
  updatedAt: string;
}

export interface BuildingSummary {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  buildingId: string;
  buildingName?: string;
  floor: number;
  status: "occupied" | "vacant" | "maintenance";
  size?: number; // in sqm
  monthlyRent?: number;
  tenantId?: string | null;
  tenant?: {
    id: string;
    name: string;
    email: string;
  } | null;
  teamId: string;
  team?: Team;
  building?: BuildingSummary;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  roomId: string | null;
  room?: Room | null;
  moveInDate: string;
  contractEndDate?: string | null;
  monthlyRent: number | string; // API returns string
  deposit: number | string; // API returns string
  idCardNumber?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  status: TenantStatus;
  teamId: string;
  team?: Team;
  createdAt?: string;
}

export interface TenantDraft {
  name: string;
  email: string;
  phone: string;
  moveInDate: string;
  deposit?: string;
}

export interface RoomFormValues {
  roomNumber: string;
  buildingId: string;
  floor: string;
  status: "occupied" | "vacant" | "maintenance";
  monthlyRent: string;
  size: string;
}

export interface BulkRoomFormValues {
  buildingId: string;
  floorStart: string;
  floorEnd: string;
  roomsPerFloor: string;
  startIndex: string;
  status: "occupied" | "vacant" | "maintenance";
  monthlyRent: string;
  size: string;
}

export interface ReadingFormValues {
  roomId: string;
  readingDate: string;
  waterPreviousReading: string;
  waterCurrentReading: string;
  electricPreviousReading: string;
  electricCurrentReading: string;
  waterPreviousPhoto: File | null;
  waterCurrentPhoto: File | null;
  electricPreviousPhoto: File | null;
  electricCurrentPhoto: File | null;
}

export type MeterType = "water" | "electric";

export interface InvoiceReading {
  meterType: MeterType;
  previousReading: number;
  currentReading: number;
  consumption: number;
  previousPhotoUrl: string;
  currentPhotoUrl: string;
}

export interface MeterReading {
  id: string;
  roomId: string;
  tenantId?: string;
  tenantName?: string;
  roomNumber?: string;
  meterType: MeterType;
  previousReading: number;
  currentReading: number;
  previousPhotoUrl: string;
  currentPhotoUrl: string;
  consumption: number;
  readingDate: string;
  status: "pending" | "billed" | "paid";
  createdBy?: string;
  room?: Room;
  tenant?: Tenant;
}

export interface MeterReadingGroup {
  id: string;
  roomId: string;
  roomNumber?: string;
  tenantName?: string;
  readingDate: string;
  status: "incomplete" | "pending" | "billed" | "paid";
  water?: MeterReading;
  electric?: MeterReading;
  teamId: string;
  team?: Team;
}

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  tenantId?: string;
  roomId: string;
  tenantName?: string;
  roomNumber?: string;
  buildingName?: string; // Building name for the room
  floor?: number; // Floor number for the room
  billingPeriod: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  // New fields (primary) - from API response (converted to numbers by mapper)
  waterConsumption?: number;
  electricConsumption?: number;
  waterRatePerUnit?: number;
  electricRatePerUnit?: number;
  waterSubtotal?: number;
  electricSubtotal?: number;
  waterBillingMode?: WaterBillingMode;
  waterFixedFee?: number;
  roomRent?: number; // Monthly rent for the room
  subtotal: number;
  tax: number;
  total: number;
  // Legacy fields (deprecated, may be null) - kept for backward compatibility
  waterUsage?: number | null;
  waterRate?: number | null;
  waterAmount?: number | null;
  electricUsage?: number | null;
  electricRate?: number | null;
  electricAmount?: number | null;
  paidDate?: string | null;
  createdAt?: string;
  teamId: string;
  readingGroupId?: string; // Link to reading group - ensures one invoice per reading group
  team?: Team;
  readings?: InvoiceReading[];
  readingGroup?: {
    id: string;
    roomId: string;
    readingDate: string;
    status: "incomplete" | "pending" | "billed" | "paid";
    teamId: string;
    meterReadings?: Array<{
      id: string;
      readingGroupId: string;
      roomId: string;
      tenantId?: string;
      meterType: "WATER" | "ELECTRIC";
      previousReading: number | string;
      currentReading: number | string;
      consumption: number | string;
      previousPhotoUrl?: string | null;
      currentPhotoUrl?: string | null;
      readingDate: string;
      status: "pending" | "billed" | "paid";
      createdBy?: string;
    }>;
  };
  tenant?: Tenant;
  room?: Room;
}

export interface AdminSettings {
  teamId: string;
  team?: Team;
  waterRatePerUnit: number;
  waterBillingMode: WaterBillingMode;
  waterFixedFee: number;
  electricRatePerUnit: number;
  taxRate: number;
  currency: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  invoicePrefix: string;
  paymentTermsDays: number;
  defaultRoomRent: number;
  defaultRoomSize: number;
  // Payment & Billing Details
  bankName?: string;
  bankAccountNumber?: string;
  lineId?: string;
  promptpayEnabled?: boolean;
  promptpayType?: "PHONE" | "NATIONAL_ID" | "EWALLET";
  promptpayId?: string;
  latePaymentPenaltyPerDay?: number;
  dueDateDayOfMonth?: number; // Day of month (1-31) when bills are due
  // Thai Labels (optional - defaults to Thai if not set)
  labelRoomRent?: string; // Default: "ค่าเช่าห้อง"
  labelWater?: string; // Default: "ค่าน้ำประปา"
  labelElectricity?: string; // Default: "ค่าไฟฟ้า"
  labelInvoice?: string; // Default: "ใบแจ้งหนี้"
}

export interface AdminInvitation {
  id: string;
  email: string;
  teamId: string;
  team?: Team;
  invitedBy: string;
  invitedByName: string;
  status: "pending" | "accepted" | "expired";
  inviteCode: string;
  expiresAt: string;
  createdAt: string;
  buildings?: string[]; // Building IDs in the team this admin can access
}

export interface ValidationError {
  field: string;
  message: string;
}
