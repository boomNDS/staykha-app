/**
 * Type definitions for PocketBase API client
 */

export type PocketBaseClient = {
  get: <T = unknown>(url: string, options?: { params?: Record<string, unknown> }) => Promise<T>
  post: <T = unknown>(url: string, body?: unknown) => Promise<T>
  patch: <T = unknown>(url: string, body?: unknown) => Promise<T>
  delete: <T = unknown>(url: string) => Promise<T>
}

export type RecordMeta = {
  id: string
  created: string
  updated: string
}

export type ListResponse<T> = {
  page: number
  perPage: number
  totalItems: number
  items: (T & RecordMeta)[]
}
