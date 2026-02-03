type ApiEnvelope = {
  status?: number;
  message?: string;
};

export type ApiListResponse<T> = ApiEnvelope & {
  items?: T[];
  data?: T[];
  results?: T[];
} & Record<string, unknown>;

export type ApiResponse<T> = ApiEnvelope & {
  data?: T;
  item?: T;
  result?: T;
} & Record<string, unknown>;

export type OkResponse = { ok: boolean };
