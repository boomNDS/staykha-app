import { BaseApiService } from "../base-service";
import type { AdminInvitation } from "@/lib/types";
import type {
  CreateInvitationData,
  InvitationAcceptResponse,
  InvitationDeleteResponse,
  InvitationResponse,
  InvitationsListResponse,
} from "./invitations-types";

class InvitationsApi extends BaseApiService {
  async getAll(
    teamId?: string,
    token?: string,
  ): Promise<AdminInvitation[]> {
    try {
      const api = this.createApi(token);
      const response = await api.get<InvitationsListResponse>("/invitations", {
        params: teamId ? { teamId } : undefined,
      });
      // Extract invitations array from wrapped response
      return response.invitations ?? [];
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
