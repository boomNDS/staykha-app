import { BaseApiService } from "../base-service";
import type {
  BuildingCreateRequest,
  BuildingDeleteResponse,
  BuildingResponse,
  BuildingUpdateRequest,
  BuildingsListResponse,
} from "./buildings-types";
import { getData, getList } from "../response-helpers";

class BuildingsApi extends BaseApiService {
  async getAll(
    token?: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<BuildingsListResponse> {
    try {
      const api = this.createApi(token);
      const response = await api.get<BuildingsListResponse>("/buildings", {
        params: {
          page: options.page ?? 1,
          limit: options.limit ?? 20,
        },
      });
      const data = getData(response) as { buildings?: any[]; items?: any[] } | null;
      const items =
        data?.buildings && Array.isArray(data.buildings)
          ? data.buildings
          : data?.items && Array.isArray(data.items)
            ? data.items
            : getList(response);
      return { ...response, data: { ...(data ?? {}), items } } as BuildingsListResponse;
    } catch (error: unknown) {
      this.handleError(error, "getAll");
    }
  }

  async getById(id: string, token?: string): Promise<BuildingResponse> {
    try {
      const api = this.createApi(token);
      return api.get<BuildingResponse>(`/buildings/${id}`);
    } catch (error: unknown) {
      this.handleError(error, "getById", { id });
    }
  }

  async create(
    data: BuildingCreateRequest,
    token?: string,
  ): Promise<BuildingResponse> {
    try {
      const api = this.createApi(token);
      return api.post<BuildingResponse>("/buildings", data);
    } catch (error: unknown) {
      this.handleError(error, "create", { name: data.name });
    }
  }

  async update(
    id: string,
    data: BuildingUpdateRequest,
    token?: string,
  ): Promise<BuildingResponse> {
    try {
      const api = this.createApi(token);
      return api.patch<BuildingResponse>(`/buildings/${id}`, data);
    } catch (error: unknown) {
      this.handleError(error, "update", { id });
    }
  }

  async remove(id: string, token?: string): Promise<BuildingDeleteResponse> {
    try {
      const api = this.createApi(token);
      return api.delete<BuildingDeleteResponse>(`/buildings/${id}`);
    } catch (error: unknown) {
      this.handleError(error, "remove", { id });
    }
  }
}

export const buildingsApi = new BuildingsApi();
