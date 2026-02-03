import { createApi } from "../client";
import type { ImportSuccessResponse } from "./imports-types";

class ImportsApi {
  async downloadDemo(options?: {
    lang?: "th" | "en";
    format?: "xlsx" | "csv";
    sheet?: "buildings" | "rooms" | "tenants";
    token?: string | null;
  }): Promise<Blob> {
    const api = createApi(options?.token ?? undefined);
    const params = {
      ...(options?.lang && options.lang !== "th" ? { lang: options.lang } : {}),
      ...(options?.format === "csv" ? { format: "csv" } : {}),
      ...(options?.sheet ? { sheet: options.sheet } : {}),
    };
    return api.get<Blob>("/imports/demo", {
      responseType: "blob",
      params: Object.keys(params).length ? params : undefined,
    });
  }

  async importOwner(
    formData: FormData,
    options?: { mode?: "upsert" | "create"; token?: string | null },
  ): Promise<ImportSuccessResponse> {
    const api = createApi(options?.token ?? undefined);
    return api.post<ImportSuccessResponse>("/imports/owner", formData, {
      params: options?.mode === "create" ? { mode: "create" } : undefined,
    });
  }
}

export const importsApi = new ImportsApi();
