import { BaseApiService } from "../base-service";
import type {
  InvoiceResponse,
  InvoiceUpdateRequest,
  InvoicesListResponse,
} from "./invoices-types";

class InvoicesApi extends BaseApiService {
  async getAll(token?: string): Promise<InvoicesListResponse> {
    try {
      const api = this.createApi(token);
      return api.get<InvoicesListResponse>("/invoices");
    } catch (error: unknown) {
      this.handleError(error, "getAll");
    }
  }

  async getById(id: string, token?: string): Promise<InvoiceResponse> {
    try {
      const api = this.createApi(token);
      return api.get<InvoiceResponse>(`/invoices/${id}`);
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

  async generateFromReadingGroup(
    readingGroupId: string,
    token?: string,
  ): Promise<InvoiceResponse> {
    try {
      const api = this.createApi(token);
      return api.post<InvoiceResponse>("/invoices/from-reading-group", {
        readingGroupId,
      });
    } catch (error: unknown) {
      this.handleError(error, "generateFromReadingGroup", {
        readingGroupId,
      });
    }
  }
}

export const invoicesApi = new InvoicesApi();
