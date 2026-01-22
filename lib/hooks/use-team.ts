/**
 * Hook to manage team state using React Query
 * Simplified to use React Query directly without Jotai sync
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { teamsApi } from "../api-client";
import {
  isOwnerAtom,
  userTeamIdAtom,
} from "../atoms";
import { getData } from "../api/response-helpers";
import type { Team } from "../types";

export function useTeam() {
  const teamId = useAtomValue(userTeamIdAtom);
  const isOwner = useAtomValue(isOwnerAtom);
  const queryClient = useQueryClient();

  const teamQuery = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => {
      if (!teamId) {
        throw new Error("Team ID is required to load team");
      }
      return teamsApi.getById(teamId);
    },
    enabled: !!teamId && isOwner,
    retry: false, // Don't retry if API fails
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const updateTeamMutation = useMutation({
    mutationFn: (updates: Partial<Team>) => {
      if (!teamId) {
        throw new Error("Team ID is required to update team");
      }
      return teamsApi.update(teamId, updates);
    },
    onSuccess: (data) => {
      // Update React Query cache
      queryClient.setQueryData(["team", teamId], data);
    },
  });

  return {
    team: getData(teamQuery.data) ?? null,
    isLoading: teamQuery.isLoading,
    isUpdating: updateTeamMutation.isPending,
    updateTeam: updateTeamMutation.mutateAsync,
    refetch: teamQuery.refetch,
  };
}
