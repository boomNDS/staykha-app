import type { ApiListResponse, ApiResponse, OkResponse } from "@/lib/api/response";
import type { AdminInvitation, Team } from "@/lib/types";

export type InvitationsListResponse = ApiListResponse<AdminInvitation>;

export type InvitationResponse = ApiResponse<AdminInvitation>;

export type InvitationAcceptResponse = ApiResponse<{
  invitation: AdminInvitation;
  team: Team;
}>;

export type InvitationDeleteResponse = ApiResponse<OkResponse>;

export type CreateInvitationData = {
  email: string;
  name: string;
  teamId: string;
  message?: string;
};
