import type { ApiResponse } from "@/lib/api/response";
import type { Invoice, MeterReadingGroup, Tenant } from "@/lib/types";

export interface OverviewSummary {
  buildings: number;
  rooms: {
    total: number;
    byStatus: {
      OCCUPIED: number;
      VACANT: number;
      MAINTENANCE: number;
    };
  };
  tenants: {
    total: number;
    byStatus: {
      ACTIVE: number;
      INACTIVE: number;
      EXPIRED: number;
    };
  };
  invoices: {
    total: number;
    byStatus: {
      DRAFT: number;
      SENT: number;
      PAID: number;
      PENDING: number;
      OVERDUE: number;
    };
  };
  readingGroups: {
    total: number;
    byStatus: {
      INCOMPLETE: number;
      PENDING: number;
      BILLED: number;
      PAID: number;
    };
  };
}

export interface OverviewRevenue {
  totalPaid: number | string;
  totalPaidCount: number;
  pendingAmount: number | string;
  pendingCount: number;
}

export interface OverviewInvoiceItem {
  id: string;
  invoiceNumber: string;
  total: number | string;
  status: "DRAFT" | "SENT" | "PAID" | "PENDING" | "OVERDUE";
  dueDate: string;
  tenant: {
    id: string;
    name: string;
  };
  room: {
    id: string;
    roomNumber: string;
    building: {
      name: string;
    };
  };
}

export interface OverviewReadingItem {
  id: string;
  roomId: string;
  roomNumber: string;
  buildingName: string;
  tenantName: string | null;
  readingDate: string;
  status: "INCOMPLETE" | "PENDING" | "BILLED" | "PAID";
  water?: {
    consumption: number | string;
  } | null;
  electric?: {
    consumption: number | string;
  } | null;
}

export interface OverviewData {
  summary: OverviewSummary;
  revenue: OverviewRevenue;
  recentInvoices: OverviewInvoiceItem[];
  upcomingInvoices: OverviewInvoiceItem[];
  overdueInvoices: OverviewInvoiceItem[];
  pendingReadings: OverviewReadingItem[];
}

export type OverviewResponse = ApiResponse<OverviewData>;
