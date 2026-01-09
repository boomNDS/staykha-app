/**
 * Hook to manage settings state using Jotai + React Query
 * Settings are fetched via React Query but also stored in Jotai for easy access
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { useMemo } from "react";
import { settingsApi } from "../api-client";
import { settingsAtom, settingsLoadingAtom, userTeamIdAtom } from "../atoms";
import type { AdminSettings } from "../types";

export function useSettings() {
  const teamId = useAtomValue(userTeamIdAtom);
  const [settings, setSettings] = useAtom(settingsAtom);
  const [, setLoading] = useAtom(settingsLoadingAtom);
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

  // Sync React Query data to Jotai atom
  useMemo(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data.settings);
    }
    setLoading(settingsQuery.isLoading);
  }, [settingsQuery.data, settingsQuery.isLoading, setSettings, setLoading]);

  const updateSettingsMutation = useMutation({
    mutationFn: (updates: Partial<AdminSettings>) => {
      if (!teamId) {
        throw new Error("Team ID is required to update settings");
      }
      return settingsApi.update(teamId, updates);
    },
    onSuccess: (data) => {
      // Update both React Query cache and Jotai atom
      queryClient.setQueryData(["settings", teamId], data);
      setSettings(data.settings);
    },
  });

  return {
    settings: settings ?? settingsQuery.data?.settings ?? null,
    isLoading: settingsQuery.isLoading,
    isUpdating: updateSettingsMutation.isPending,
    updateSettings: updateSettingsMutation.mutateAsync,
    refetch: settingsQuery.refetch,
  };
}
