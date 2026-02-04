import type { ApiListResponse, ApiResponse } from "@/lib/api/response";

export const getList = <T>(response?: ApiListResponse<T>): T[] => {
  if (!response) return [];
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.results)) return response.results;
  const data = (response as { data?: unknown }).data as
    | { items?: T[]; results?: T[] }
    | undefined;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

export const getData = <T>(response?: ApiResponse<T>): T | null =>
  response?.data ?? response?.item ?? response?.result ?? null;

export const getPaginationMeta = (response?: ApiListResponse<unknown>) => {
  const data = (response as { data?: any })?.data;
  return {
    total: data?.total ?? (response as any)?.total ?? 0,
    limit: data?.limit ?? (response as any)?.limit ?? 0,
    page: data?.page ?? (response as any)?.page ?? 1,
    hasMore: data?.hasMore ?? (response as any)?.hasMore ?? false,
  };
};
