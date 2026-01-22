import { BaseApiService } from "../base-service";
import type {
  BuildingCreateRequest,
  BuildingDeleteResponse,
  BuildingDirectResponse,
  BuildingResponse,
  BuildingUpdateRequest,
  BuildingsDirectListResponse,
} from "./buildings-types";

class BuildingsApi extends BaseApiService {
  async getAll(token?: string): Promise<BuildingsDirectListResponse> {
    try {
      const api = this.createApi(token);
      return api.get<BuildingsDirectListResponse>("/buildings");
    } catch (error: unknown) {
      this.handleError(error, "getAll");
    }
  }

  async getById(id: string, token?: string): Promise<BuildingDirectResponse> {
    try {
      const api = this.createApi(token);
      return api.get<BuildingDirectResponse>(`/buildings/${id}`);
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
