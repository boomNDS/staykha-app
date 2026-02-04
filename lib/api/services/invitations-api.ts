import { BaseApiService } from "../base-service";
import type {
  CreateInvitationData,
  InvitationAcceptResponse,
  InvitationDeleteResponse,
  InvitationResponse,
  InvitationsListResponse,
} from "./invitations-types";
import { getData, getList } from "../response-helpers";

class InvitationsApi extends BaseApiService {
  async getAll(
    teamId?: string,
    token?: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<InvitationsListResponse> {
    try {
      const api = this.createApi(token);
      const response = await api.get<InvitationsListResponse>("/invitations", {
        params: {
          ...(teamId ? { teamId } : {}),
          page: options.page ?? 1,
          limit: options.limit ?? 20,
        },
      });
      const data = getData(response) as { items?: any[]; invitations?: any[] } | null;
      const items =
        data?.invitations && Array.isArray(data.invitations)
          ? data.invitations
          : data?.items && Array.isArray(data.items)
            ? data.items
            : getList(response);
      return { ...response, data: { ...(data ?? {}), items } } as InvitationsListResponse;
    } catch (error: unknown) {
      this.handleError(error, "getAll", { teamId });
    }
  }

  async create(
    data: CreateInvitationData & { teamId: string },
    token?: string,
  ): Promise<InvitationResponse> {
    try {
      const api = this.createApi(token);
      return api.post<InvitationResponse>("/invitations", data);
    } catch (error: unknown) {
      this.handleError(error, "create", { email: data.email });
    }
  }

  async acceptByCode(
    inviteCode: string,
    userId: string,
    token?: string,
  ): Promise<InvitationAcceptResponse> {
    try {
      const api = this.createApi(token);
      return api.post<InvitationAcceptResponse>("/invitations/accept", {
        inviteCode,
        userId,
      });
    } catch (error: unknown) {
      this.handleError(error, "acceptByCode", { inviteCode, userId });
    }
  }

  async remove(
    id: string,
    token?: string,
  ): Promise<InvitationDeleteResponse> {
    try {
      const api = this.createApi(token);
      return api.delete<InvitationDeleteResponse>(`/invitations/${id}`);
    } catch (error: unknown) {
      this.handleError(error, "remove", { id });
    }
  }
}

export const invitationsApi = new InvitationsApi();
