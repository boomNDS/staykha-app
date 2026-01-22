import type { ApiResponse, OkResponse } from "@/lib/api/response";
import type { AdminInvitation, Team } from "@/lib/types";

export interface InvitationsListResponse {
  invitations: AdminInvitation[];
}

export type InvitationResponse = ApiResponse<AdminInvitation>;

export interface InvitationAcceptResponse {
  invitation: AdminInvitation;
  team: Team;
}

export type InvitationDeleteResponse = OkResponse;

export type CreateInvitationData = {
  email: string;
  name: string;
  teamId: string;
  message?: string;
};
