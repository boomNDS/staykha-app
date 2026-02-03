import { BaseApiService } from "../base-service";
import type {
  TenantCreateRequest,
  TenantDeleteResponse,
  TenantResponse,
  TenantUpdateRequest,
  TenantsListResponse,
} from "./tenants-types";

class TenantsApi extends BaseApiService {
  async getAll(token?: string): Promise<TenantsListResponse> {
    try {
      const api = this.createApi(token);
      return api.get<TenantsListResponse>("/tenants");
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
