export type DataFreshness = "live" | "recent" | "stale" | "historical" | "user_submitted" | "unknown";
export type DataType = "live" | "historical" | "user_submitted" | "calculated";

export type SourceMeta = {
  name: string;
  url: string;
  retrieved_at: string;
  data_type: DataType;
  freshness: DataFreshness;
  verification_status: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  generated_at: string;
  query: Record<string, unknown>;
  sources: SourceMeta[];
  warnings: string[];
  unavailable_fields: string[];
  request_id: string;
};
