import { BaseApiService } from "../base-service";
import type { Invoice } from "@/lib/types";
import { InvoiceStatus, WaterBillingMode } from "@/lib/types";
import type {
  InvoiceResponse,
  InvoiceUpdateRequest,
  InvoicesListResponse,
} from "./invoices-types";

// Helper to map API response (string numbers, uppercase enums) to Invoice type
function mapInvoiceFromApi(apiInvoice: any): Invoice {
  return {
    ...apiInvoice,
    // Convert string numbers to actual numbers
    waterConsumption:
      apiInvoice.waterConsumption === null || apiInvoice.waterConsumption === undefined
        ? undefined
        : typeof apiInvoice.waterConsumption === "string"
          ? Number.parseFloat(apiInvoice.waterConsumption)
          : apiInvoice.waterConsumption,
    waterRatePerUnit:
      apiInvoice.waterRatePerUnit === null || apiInvoice.waterRatePerUnit === undefined
        ? undefined
        : typeof apiInvoice.waterRatePerUnit === "string"
          ? Number.parseFloat(apiInvoice.waterRatePerUnit)
          : apiInvoice.waterRatePerUnit,
    waterSubtotal:
      apiInvoice.waterSubtotal === null || apiInvoice.waterSubtotal === undefined
        ? undefined
        : typeof apiInvoice.waterSubtotal === "string"
          ? Number.parseFloat(apiInvoice.waterSubtotal)
          : apiInvoice.waterSubtotal,
    electricConsumption:
      apiInvoice.electricConsumption === null || apiInvoice.electricConsumption === undefined
        ? undefined
        : typeof apiInvoice.electricConsumption === "string"
          ? Number.parseFloat(apiInvoice.electricConsumption)
          : apiInvoice.electricConsumption,
    electricRatePerUnit:
      apiInvoice.electricRatePerUnit === null || apiInvoice.electricRatePerUnit === undefined
        ? undefined
        : typeof apiInvoice.electricRatePerUnit === "string"
          ? Number.parseFloat(apiInvoice.electricRatePerUnit)
          : apiInvoice.electricRatePerUnit,
    electricSubtotal:
      apiInvoice.electricSubtotal === null || apiInvoice.electricSubtotal === undefined
        ? undefined
        : typeof apiInvoice.electricSubtotal === "string"
          ? Number.parseFloat(apiInvoice.electricSubtotal)
          : apiInvoice.electricSubtotal,
    roomRent:
      apiInvoice.roomRent === null || apiInvoice.roomRent === undefined
        ? undefined
        : typeof apiInvoice.roomRent === "string"
          ? Number.parseFloat(apiInvoice.roomRent)
          : apiInvoice.roomRent,
    subtotal:
      typeof apiInvoice.subtotal === "string"
        ? Number.parseFloat(apiInvoice.subtotal)
        : apiInvoice.subtotal ?? 0,
    tax:
      typeof apiInvoice.tax === "string"
        ? Number.parseFloat(apiInvoice.tax)
        : apiInvoice.tax ?? 0,
    total:
      typeof apiInvoice.total === "string"
        ? Number.parseFloat(apiInvoice.total)
        : apiInvoice.total ?? 0,
    // Legacy fields (may be null)
    waterUsage:
      apiInvoice.waterUsage === null || apiInvoice.waterUsage === undefined
        ? undefined
        : typeof apiInvoice.waterUsage === "string"
          ? Number.parseFloat(apiInvoice.waterUsage)
          : apiInvoice.waterUsage,
    waterRate:
      apiInvoice.waterRate === null || apiInvoice.waterRate === undefined
        ? undefined
        : typeof apiInvoice.waterRate === "string"
          ? Number.parseFloat(apiInvoice.waterRate)
          : apiInvoice.waterRate,
    waterAmount:
      apiInvoice.waterAmount === null || apiInvoice.waterAmount === undefined
        ? undefined
        : typeof apiInvoice.waterAmount === "string"
          ? Number.parseFloat(apiInvoice.waterAmount)
          : apiInvoice.waterAmount,
    electricUsage:
      apiInvoice.electricUsage === null || apiInvoice.electricUsage === undefined
        ? undefined
        : typeof apiInvoice.electricUsage === "string"
          ? Number.parseFloat(apiInvoice.electricUsage)
          : apiInvoice.electricUsage,
    electricRate:
      apiInvoice.electricRate === null || apiInvoice.electricRate === undefined
        ? undefined
        : typeof apiInvoice.electricRate === "string"
          ? Number.parseFloat(apiInvoice.electricRate)
          : apiInvoice.electricRate,
    electricAmount:
      apiInvoice.electricAmount === null || apiInvoice.electricAmount === undefined
        ? undefined
        : typeof apiInvoice.electricAmount === "string"
          ? Number.parseFloat(apiInvoice.electricAmount)
          : apiInvoice.electricAmount,
    // Convert uppercase status to enum
    status: (apiInvoice.status?.toUpperCase() ?? InvoiceStatus.DRAFT) as InvoiceStatus,
    // Convert uppercase waterBillingMode to enum
    waterBillingMode:
      apiInvoice.waterBillingMode?.toUpperCase() === WaterBillingMode.FIXED
        ? WaterBillingMode.FIXED
        : WaterBillingMode.METERED,
    waterFixedFee:
      apiInvoice.waterFixedFee === null || apiInvoice.waterFixedFee === undefined
        ? undefined
        : typeof apiInvoice.waterFixedFee === "string"
          ? Number.parseFloat(apiInvoice.waterFixedFee)
          : apiInvoice.waterFixedFee,
  };
}

class InvoicesApi extends BaseApiService {
  async getAll(token?: string): Promise<InvoicesListResponse> {
    try {
      const api = this.createApi(token);
      // API returns direct array or wrapped response
      const response = await api.get<any>("/invoices");
      if (response) {
        // Handle both direct array and wrapped response
        const invoices = (response.invoices ?? response.data ?? response.items ?? response) as any[];
        if (Array.isArray(invoices)) {
          const mappedInvoices = invoices.map(mapInvoiceFromApi);
          return { data: mappedInvoices } as InvoicesListResponse;
        }
      }
      return { data: [] } as InvoicesListResponse;
    } catch (error: unknown) {
      this.handleError(error, "getAll");
    }
  }

  async getById(id: string, token?: string): Promise<InvoiceResponse> {
    try {
      const api = this.createApi(token);
      // API returns direct object or wrapped response
      const response = await api.get<any>(`/invoices/${id}`);
      if (response) {
        // Handle both direct object and wrapped response
        const invoiceData = response.invoice ?? response.data ?? response;
        if (invoiceData && typeof invoiceData === "object") {
          const mappedInvoice = mapInvoiceFromApi(invoiceData);
          return { data: mappedInvoice } as InvoiceResponse;
        }
      }
      throw new Error("Invoice not found");
    } catch (error: unknown) {
      this.handleError(error, "getById", { id });
    }
  }

  async update(
    id: string,
    updates: InvoiceUpdateRequest,
    token?: string,
  ): Promise<InvoiceResponse> {
    try {
      const api = this.createApi(token);
      return api.patch<InvoiceResponse>(`/invoices/${id}`, updates);
    } catch (error: unknown) {
      this.handleError(error, "update", { id });
    }
  }

  async downloadPdf(id: string, token?: string): Promise<Blob> {
    try {
      const api = this.createApi(token);
      return api.get<Blob>(`/invoices/${id}/pdf`, {
        responseType: "blob",
      });
    } catch (error: unknown) {
      this.handleError(error, "downloadPdf", { id });
    }
  }

  /**
   * POST /v1/invoices/from-reading-group
   * Generate an invoice from a reading group
   * API returns: { invoice: Invoice }
   */
  async generateFromReadingGroup(
    readingGroupId: string,
    token?: string,
  ): Promise<InvoiceResponse> {
    try {
      const api = this.createApi(token);
      // API returns: { invoice: Invoice }
      const response = await api.post<{ invoice: any }>("/invoices/from-reading-group", {
        readingGroupId,
      });
      // Extract and map invoice from response
      if (response?.invoice && typeof response.invoice === "object") {
        const mappedInvoice = mapInvoiceFromApi(response.invoice);
        return { data: mappedInvoice } as InvoiceResponse;
      }
      throw new Error("Invalid response from invoice generation");
    } catch (error: unknown) {
      this.handleError(error, "generateFromReadingGroup", {
        readingGroupId,
      });
    }
  }
}

export const invoicesApi = new InvoicesApi();
