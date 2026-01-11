/**
 * Hook to manage team state using Jotai + React Query
 * Team data is fetched via React Query but also stored in Jotai for easy access
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { teamsApi } from "../api-client";
import {
  isOwnerAtom,
  teamAtom,
  teamLoadingAtom,
  userTeamIdAtom,
} from "../atoms";
import type { Team } from "../types";

export function useTeam() {
  const teamId = useAtomValue(userTeamIdAtom);
  const isOwner = useAtomValue(isOwnerAtom);
  const [team, setTeam] = useAtom(teamAtom);
  const [, setLoading] = useAtom(teamLoadingAtom);
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
  });

  // Sync React Query data to Jotai atom
  useEffect(() => {
    if (teamQuery.data?.team) {
      setTeam(teamQuery.data.team);
    }
    setLoading(teamQuery.isLoading);
  }, [teamQuery.data, teamQuery.isLoading, setTeam, setLoading]);

  const updateTeamMutation = useMutation({
    mutationFn: (updates: Partial<Team>) => {
      if (!teamId) {
        throw new Error("Team ID is required to update team");
      }
      return teamsApi.update(teamId, updates);
    },
    onSuccess: (data) => {
      // Update both React Query cache and Jotai atom
      queryClient.setQueryData(["team", teamId], data);
      setTeam(data.team);
    },
  });

  return {
    team: team ?? teamQuery.data?.team ?? null,
    isLoading: teamQuery.isLoading,
    isUpdating: updateTeamMutation.isPending,
    updateTeam: updateTeamMutation.mutateAsync,
    refetch: teamQuery.refetch,
  };
}
