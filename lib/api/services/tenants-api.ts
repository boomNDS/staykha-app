import { BaseApiService } from "../base-service";
import type {
  TenantCreateRequest,
  TenantDeleteResponse,
  TenantDirectResponse,
  TenantResponse,
  TenantUpdateRequest,
  TenantsDirectListResponse,
} from "./tenants-types";

class TenantsApi extends BaseApiService {
  async getAll(token?: string): Promise<TenantsDirectListResponse> {
    try {
      const api = this.createApi(token);
      return api.get<TenantsDirectListResponse>("/tenants");
    } catch (error: unknown) {
      this.handleError(error, "getAll");
    }
  }

  async getById(id: string, token?: string): Promise<TenantDirectResponse> {
    try {
      const api = this.createApi(token);
      return api.get<TenantDirectResponse>(`/tenants/${id}`);
    } catch (error: unknown) {
      this.handleError(error, "getById", { id });
    }
  }

  async create(
    data: TenantCreateRequest,
    token?: string,
  ): Promise<TenantDirectResponse> {
    try {
      const api = this.createApi(token);
      return api.post<TenantDirectResponse>("/tenants", data);
    } catch (error: unknown) {
      this.handleError(error, "create", { name: data.name });
    }
  }

  async update(
    id: string,
    updates: TenantUpdateRequest,
    token?: string,
  ): Promise<TenantDirectResponse> {
    try {
      const api = this.createApi(token);
      return api.patch<TenantDirectResponse>(`/tenants/${id}`, updates);
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
