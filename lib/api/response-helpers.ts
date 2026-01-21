import type { ApiListResponse, ApiResponse } from "@/lib/api/response";

export const getList = <T>(response?: ApiListResponse<T>): T[] =>
  response?.items ?? response?.data ?? response?.results ?? [];

export const getData = <T>(response?: ApiResponse<T>): T | null =>
  response?.data ?? response?.item ?? response?.result ?? null;
