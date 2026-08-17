import { api } from "./client";

export type ImeoFeedMode = "manual" | "api";
export type DataFeedProvider = "imeo" | "carbon_mapper" | "tropomi" | "emit";
export interface ImeoBatch {
  id: string; filename: string; format: string; reportingMonth: string;
  recordCount: number; isActive: boolean; restoredAt?: string; createdAt: string; uploadedBy: string; expiresAt?: string; provider: DataFeedProvider;
}
export interface ImeoFeedStatus {
  mode: ImeoFeedMode | "inactive";
  lastApiTestAt?: string;
  lastApiTestSuccess?: boolean;
  lastApiTestMessage?: string;
  blockedReason?: string;
  activeBatch?: ImeoBatch | null;
}
export interface DataFeedPreview {
  filename: string; containedDataset: string; format: string;
  globalRecordCount: number; recordCount: number;
  finalRecordCount: number; addedCount: number; updatedCount: number;
  unchangedCount: number; overlappingCount: number; retainedCount: number;
  earliestDate?: string | null; latestDate?: string | null;
  earliestMonth?: string | null; latestMonth?: string | null;
  monthCount: number; monthScope: "single_month" | "all_months";
  reminderAt: string; reminderBasis: "document" | "latest_observation" | "seven_day_default";
}

const data = <T>(response: { data: { data: T } }) => response.data.data;
export const imeoFeedApi = {
  status: async (provider: DataFeedProvider) => data<ImeoFeedStatus>(await api.get(`/data-feeds/${provider}/status`)),
  history: async (provider: DataFeedProvider) => data<ImeoBatch[]>(await api.get(`/data-feeds/${provider}/history`)),
  preview: async (provider: DataFeedProvider, file: File) => {
    const form = new FormData(); form.append("file", file);
    return data<DataFeedPreview>(await api.post(`/data-feeds/${provider}/preview`, form, { headers: { "Content-Type": "multipart/form-data" } }));
  },
  upload: async (provider: DataFeedProvider, file: File, reportingMonth: string, expiresAt: string) => {
    const form = new FormData(); form.append("file", file); form.append("reportingMonth", reportingMonth); form.append("expiresAt", expiresAt);
    return data<ImeoBatch>(await api.post(`/data-feeds/${provider}/upload`, form, { headers: { "Content-Type": "multipart/form-data" } }));
  },
  setMode: async (provider: DataFeedProvider, mode: ImeoFeedMode) => data<ImeoFeedStatus>(await api.put(`/data-feeds/${provider}/mode`, { mode })),
  testApi: async (provider: DataFeedProvider) => data<{ success: boolean; message: string; count: number }>(await api.post(`/data-feeds/${provider}/test-api`)),
  restore: async (provider: DataFeedProvider, batchId: string) => data<ImeoFeedStatus>(await api.post(`/data-feeds/${provider}/batches/${batchId}/restore`)),
  deleteBatch: async (provider: DataFeedProvider, batchId: string) => data<{ id: string; deleted: boolean }>(await api.delete(`/data-feeds/${provider}/batches/${batchId}`)),
  downloadSample: async (provider: DataFeedProvider, format: "csv" | "json" | "geojson" | "zip") => {
    const response = await api.get(`/data-feeds/${provider}/sample/${format}`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${provider}-methane-sample.${format}`; anchor.click(); URL.revokeObjectURL(url);
  },
  download: async (provider: DataFeedProvider, batch: ImeoBatch) => {
    const response = await api.get(`/data-feeds/${provider}/batches/${batch.id}/download`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = batch.filename; anchor.click(); URL.revokeObjectURL(url);
  },
};
