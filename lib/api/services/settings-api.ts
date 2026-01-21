import { BaseApiService } from "../base-service";
import { ApiError } from "../errors";
import type {
  SettingsCreateRequest,
  SettingsResponse,
  SettingsUpdateRequest,
  SettingsUpdateResponse,
} from "./settings-types";

class SettingsApi extends BaseApiService {
  async get(teamId: string, token?: string): Promise<SettingsResponse> {
    try {
      const api = this.createApi(token);
      return await api.get<SettingsResponse>("/settings", {
        params: { teamId },
      });
    } catch (error: unknown) {
      // Handle 404 as null settings (not an error)
      if (error instanceof ApiError && error.statusCode === 404) {
        return { data: null };
      }
      this.handleError(error, "get", { teamId });
    }
  }

  async update(
    teamId: string,
    updates: SettingsUpdateRequest,
    token?: string,
  ): Promise<SettingsUpdateResponse> {
    try {
      const api = this.createApi(token);
      return api.patch<SettingsUpdateResponse>(`/settings/${teamId}`, updates);
    } catch (error: unknown) {
      this.handleError(error, "update", { teamId });
    }
  }

  async create(
    teamId: string,
    data: SettingsCreateRequest,
    token?: string,
  ): Promise<SettingsUpdateResponse> {
    try {
      const api = this.createApi(token);
      return api.post<SettingsUpdateResponse>("/settings", {
        teamId,
        ...data,
      });
    } catch (error: unknown) {
      this.handleError(error, "create", { teamId });
    }
  }
}

export const settingsApi = new SettingsApi();
