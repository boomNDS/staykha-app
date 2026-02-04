import { BaseApiService } from "../base-service";
import type {
  TenantCreateRequest,
  TenantDeleteResponse,
  TenantResponse,
  TenantUpdateRequest,
  TenantsListResponse,
} from "./tenants-types";
import { getData, getList } from "../response-helpers";

class TenantsApi extends BaseApiService {
  async getAll(
    token?: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<TenantsListResponse> {
    try {
      const api = this.createApi(token);
      const response = await api.get<TenantsListResponse>("/tenants", {
        params: {
          page: options.page ?? 1,
          limit: options.limit ?? 20,
        },
      });
      const data = getData(response) as { tenants?: any[]; items?: any[] } | null;
      const items =
        data?.tenants && Array.isArray(data.tenants)
          ? data.tenants
          : data?.items && Array.isArray(data.items)
            ? data.items
            : getList(response);
      return { ...response, data: { ...(data ?? {}), items } } as TenantsListResponse;
    } catch (error: unknown) {
      this.handleError(error, "getAll");
    }
  }

  async getById(id: string, token?: string): Promise<TenantResponse> {
    try {
      const api = this.createApi(token);
      return api.get<TenantResponse>(`/tenants/${id}`);
    } catch (error: unknown) {
      this.handleError(error, "getById", { id });
    }
  }

  async create(
    data: TenantCreateRequest,
    token?: string,
  ): Promise<TenantResponse> {
    try {
      const api = this.createApi(token);
      return api.post<TenantResponse>("/tenants", data);
    } catch (error: unknown) {
      this.handleError(error, "create", { name: data.name });
    }
  }

  async update(
    id: string,
    updates: TenantUpdateRequest,
    token?: string,
  ): Promise<TenantResponse> {
    try {
      const api = this.createApi(token);
      return api.patch<TenantResponse>(`/tenants/${id}`, updates);
    } catch (error: unknown) {
      this.handleError(error, "update", { id });
    }
  }

  async remove(id: string, token?: string): Promise<TenantDeleteResponse> {
    try {
      const api = this.createApi(token);
      return api.delete<TenantDeleteResponse>(`/tenants/${id}`);
    } catch (error: unknown) {
      this.handleError(error, "remove", { id });
    }
  }
}

export const tenantsApi = new TenantsApi();
