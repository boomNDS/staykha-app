import { BaseApiService } from "../base-service";
import type {
  AdminDeleteResponse,
  AdminsListResponse,
} from "./admins-types";
import { getData, getList } from "../response-helpers";

class AdminsApi extends BaseApiService {
  async getAll(
    teamId?: string,
    token?: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<AdminsListResponse> {
    try {
      const api = this.createApi(token);
      const response = await api.get<AdminsListResponse>("/admins", {
        params: {
          ...(teamId ? { teamId } : {}),
          page: options.page ?? 1,
          limit: options.limit ?? 20,
        },
      });
      const data = getData(response) as { items?: any[]; admins?: any[] } | null;
      const items =
        data?.admins && Array.isArray(data.admins)
          ? data.admins
          : data?.items && Array.isArray(data.items)
            ? data.items
            : getList(response);
      return { ...response, data: { ...(data ?? {}), items } } as AdminsListResponse;
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
