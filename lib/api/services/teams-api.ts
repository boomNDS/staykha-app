import { BaseApiService } from "../base-service";
import type {
  TeamCreateRequest,
  TeamDeleteResponse,
  TeamDirectResponse,
  TeamResponse,
  TeamUpdateRequest,
  TeamsListResponse,
} from "./teams-types";

class TeamsApi extends BaseApiService {
  async getAll(token?: string): Promise<TeamsListResponse> {
    try {
      const api = this.createApi(token);
      return api.get<TeamsListResponse>("/teams");
    } catch (error: unknown) {
      this.handleError(error, "getAll");
    }
  }

  async getById(id: string, token?: string): Promise<TeamResponse> {
    try {
      const api = this.createApi(token);
      return api.get<TeamResponse>(`/teams/${id}`);
    } catch (error: unknown) {
      this.handleError(error, "getById", { id });
    }
  }

  async create(data: TeamCreateRequest, token?: string): Promise<TeamDirectResponse> {
    try {
      const api = this.createApi(token);
      return api.post<TeamDirectResponse>("/teams", data);
    } catch (error: unknown) {
      this.handleError(error, "create", { name: data.name });
    }
  }

  async update(
    id: string,
    data: TeamUpdateRequest,
    token?: string,
  ): Promise<TeamResponse> {
    try {
      const api = this.createApi(token);
      return api.patch<TeamResponse>(`/teams/${id}`, data);
    } catch (error: unknown) {
      this.handleError(error, "update", { id });
    }
  }

  async remove(id: string, token?: string): Promise<TeamDeleteResponse> {
    try {
      const api = this.createApi(token);
      return api.delete<TeamDeleteResponse>(`/teams/${id}`);
    } catch (error: unknown) {
      this.handleError(error, "remove", { id });
    }
  }
}

export const teamsApi = new TeamsApi();
