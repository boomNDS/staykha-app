/**
 * Mapper functions to convert PocketBase records to application domain types
 */

import type {
  Building,
  Invoice,
  MeterReadingGroup,
  Room,
  Tenant,
  AdminSettings,
  User,
  AdminInvitation,
  Team,
} from "@/lib/types"
import type { RecordMeta } from "@/types/pocketbase"
import type {
  TeamMapperInput,
  BuildingMapperInput,
  RoomMapperInput,
  TenantMapperInput,
  ReadingGroupMapperInput,
  InvoiceMapperInput,
  SettingsMapperInput,
  UserMapperInput,
  InvitationMapperInput,
} from "@/types/mappers"

export const mapTeamRecord = (record: TeamMapperInput): Team => ({
  id: record.id,
  name: record.name,
  createdAt: record.created,
  updatedAt: record.updated,
})

export const mapBuildingRecord = (record: BuildingMapperInput): Building => ({
  id: record.id,
  name: record.name,
  address: record.address,
  totalFloors: record.totalFloors ?? 1,
  totalRooms: record.totalRooms ?? 0,
  occupiedRooms: record.occupiedRooms ?? 0,
  ownerId: record.ownerId ?? "",
  teamId: record.teamId,
  createdAt: record.created,
  updatedAt: record.updated,
})

export const mapRoomRecord = (record: RoomMapperInput): Room => ({
  id: record.id,
  roomNumber: record.roomNumber,
  buildingId: record.buildingId,
  buildingName: record.buildingName,
  floor: record.floor ?? 1,
  status: record.status ?? "vacant",
  size: record.size,
  monthlyRent: record.monthlyRent,
  tenantId: record.tenantId ?? null,
  teamId: record.teamId,
})

export const mapTenantRecord = (record: TenantMapperInput): Tenant => ({
  id: record.id,
  name: record.name,
  email: record.email,
  phone: record.phone,
  roomId: record.roomId,
  moveInDate: record.moveInDate,
  monthlyRent: record.monthlyRent,
  deposit: record.deposit,
  status: record.status ?? "active",
  teamId: record.teamId,
  createdAt: record.created,
})

export const mapReadingRecord = (record: ReadingGroupMapperInput): MeterReadingGroup => ({
  id: record.id,
  roomId: record.roomId,
  roomNumber: record.roomNumber,
  tenantName: record.tenantName,
  readingDate: record.readingDate,
  status: record.status,
  water: record.water as MeterReadingGroup["water"],
  electric: record.electric as MeterReadingGroup["electric"],
  teamId: record.teamId,
})

export const mapInvoiceRecord = (record: InvoiceMapperInput): Invoice => ({
  id: record.id,
  invoiceNumber: record.invoiceNumber,
  tenantId: record.tenantId,
  roomId: record.roomId ?? "",
  tenantName: record.tenantName,
  roomNumber: record.roomNumber,
  billingPeriod: record.billingPeriod ?? "",
  issueDate: record.issueDate ?? record.created,
  dueDate: record.dueDate ?? record.created,
  status: record.status ?? "draft",
  waterUsage: record.waterUsage ?? 0,
  waterRate: record.waterRate ?? 0,
  waterAmount: record.waterAmount ?? 0,
  electricUsage: record.electricUsage ?? 0,
  electricRate: record.electricRate ?? 0,
  electricAmount: record.electricAmount ?? 0,
  subtotal: record.subtotal ?? 0,
  tax: record.tax ?? 0,
  total: record.total ?? 0,
  paidDate: record.paidDate ?? null,
  waterConsumption: record.waterConsumption,
  electricConsumption: record.electricConsumption,
  waterRatePerUnit: record.waterRatePerUnit,
  electricRatePerUnit: record.electricRatePerUnit,
  waterSubtotal: record.waterSubtotal,
  electricSubtotal: record.electricSubtotal,
  waterBillingMode: record.waterBillingMode,
  waterFixedFee: record.waterFixedFee,
  teamId: record.teamId,
})

export const mapSettingsRecord = (record: SettingsMapperInput): AdminSettings & RecordMeta => ({
  ...record,
})

export const mapUserRecord = (record: UserMapperInput): User => ({
  id: record.id,
  email: record.email,
  name: record.name ?? record.email,
  role: record.role ?? "admin",
  teamId: record.teamId,
  createdAt: record.created,
})

export const mapInvitationRecord = (record: InvitationMapperInput): AdminInvitation => ({
  id: record.id,
  email: record.email,
  teamId: record.teamId,
  invitedBy: record.invitedBy,
  invitedByName: record.invitedByName,
  status: record.status ?? "pending",
  inviteCode: record.inviteCode,
  expiresAt: record.expiresAt,
  createdAt: record.created,
  buildings: record.buildings ?? [],
})
