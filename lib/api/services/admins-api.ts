import { BaseApiService } from "../base-service";
import type {
  AdminDeleteResponse,
  AdminsListResponse,
} from "./admins-types";
import { getList } from "../response-helpers";

class AdminsApi extends BaseApiService {
  async getAll(teamId?: string, token?: string): Promise<AdminsListResponse> {
    try {
      const api = this.createApi(token);
      const response = await api.get<AdminsListResponse>("/admins", {
        params: teamId ? { teamId } : undefined,
      });
      return { ...response, data: getList(response) };
    } catch (error: unknown) {
      this.handleError(error, "getAll", { teamId });
    }
  }

  async remove(id: string, token?: string): Promise<AdminDeleteResponse> {
    try {
      const api = this.createApi(token);
      return api.delete<AdminDeleteResponse>(`/admins/${id}`);
    } catch (error: unknown) {
      this.handleError(error, "remove", { id });
    }
  }
}

export const adminsApi = new AdminsApi();
