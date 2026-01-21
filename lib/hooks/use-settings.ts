/**
 * Hook to manage settings state using React Query
 * Simplified to use React Query directly without Jotai sync
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { settingsApi } from "../api-client";
import { getData } from "../api/response-helpers";
import { userTeamIdAtom } from "../atoms";
import type { AdminSettings } from "../types";

export function useSettings() {
  const teamId = useAtomValue(userTeamIdAtom);
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["settings", teamId],
    queryFn: () => {
      if (!teamId) {
        throw new Error("Team ID is required to load settings");
      }
      return settingsApi.get(teamId);
    },
    enabled: !!teamId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (updates: Partial<AdminSettings>) => {
      if (!teamId) {
        throw new Error("Team ID is required to update settings");
      }
      return settingsApi.update(teamId, updates);
    },
    onSuccess: (data) => {
      // Update React Query cache
      queryClient.setQueryData(["settings", teamId], data);
    },
  });

  return {
    settings: getData(settingsQuery.data) ?? null,
    isLoading: settingsQuery.isLoading,
    isUpdating: updateSettingsMutation.isPending,
    updateSettings: updateSettingsMutation.mutateAsync,
    refetch: settingsQuery.refetch,
  };
}
