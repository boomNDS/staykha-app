export type ApiListResponse<T> = {
  items?: T[];
  data?: T[];
  results?: T[];
} & Record<string, unknown>;

export type ApiResponse<T> = {
  data?: T;
  item?: T;
  result?: T;
} & Record<string, unknown>;

export type OkResponse = { ok: boolean };
