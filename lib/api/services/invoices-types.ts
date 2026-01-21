import type { ApiListResponse, ApiResponse } from "@/lib/api/response";
import type { Invoice } from "@/lib/types";

export type InvoicesListResponse = ApiListResponse<Invoice>;
export type InvoiceResponse = ApiResponse<Invoice>;

export type InvoiceUpdateRequest = Partial<Invoice>;
