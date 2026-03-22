import { api } from "./client";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Facility {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sector: string;
  region: string;
}

export interface Alert {
  id: string;
  facilityId: string;
  title: string;
  description: string;
  emissionRate: number;
  severity: string;
  isRead: number;
  createdAt: string;
}

export interface EmissionStats {
  totalSources: number;
  totalMeasurements: number;
}

export interface EmissionFilters {
  startDate?: string;
  endDate?: string;
  sector?: string;
  gasType?: string;
  instrument?: string;
  minEmissionRate?: number;
  maxEmissionRate?: number;
  minPlumes?: number;
  maxPlumes?: number;
  minPersistence?: number;
  maxPersistence?: number;
  page?: number;
  limit?: number;
  bbox?: string;
}

export const emissionsApi = {
  getFacilities: () =>
    api.get<ApiResponse<Facility[]>>("/facilities").then((r) => r.data),

  getFacilityById: (id: string) =>
    api.get<ApiResponse<Facility>>(`/facilities/${id}`).then((r) => r.data),

  submitGroundData: (data: {
    facilityId: string;
    measurementDate: string;
    methaneReading: number;
    methodology: string;
    latitude?: number;
    longitude?: number;
  }) => api.post<ApiResponse<any>>("/ground-data", data).then((r) => r.data),

  getGroundData: (facilityId: string, startDate?: string, endDate?: string) =>
    api.get<ApiResponse<any[]>>(`/ground-data/${facilityId}`, {
      params: { startDate, endDate },
    }).then((r) => r.data),

  getAlerts: (limit = 20) =>
    api.get<ApiResponse<Alert[]>>("/alerts", { params: { limit } }).then((r) => r.data),

  getStats: () =>
    api.get<ApiResponse<EmissionStats>>("/stats").then((r) => r.data),

  getSatelliteSources: (filters: EmissionFilters) =>
    api.get<ApiResponse<any>>("/satellite/sources", { params: filters }).then((r) => r.data),

  refreshSatelliteRegion: (filters: EmissionFilters) =>
    api.get<ApiResponse<any>>("/satellite/refresh", { params: filters }).then((r) => r.data),

  getSatellitePlumes: (sourceId: string) =>
    api.get<ApiResponse<any[]>>(`/satellite/plumes/${sourceId}`).then((r) => r.data),

  getComparisonData: (facilityId: string, startDate?: string, endDate?: string, mode?: string, maxDistance?: number) =>
    api.get<ApiResponse<any>>(`/comparison/${facilityId}`, {
      params: { startDate, endDate, mode, maxDistance },
    }).then((r) => r.data),

  createFacility: (data: {
    name: string;
    latitude: number;
    longitude: number;
    sector?: string;
    region?: string;
  }) => api.post<ApiResponse<Facility>>("/facilities", data).then((r) => r.data),

  deleteFacility: (id: string) =>
    api.delete<ApiResponse<Facility>>(`/facilities/${id}`).then((r) => r.data),

  createAlert: (data: {
    facilityId: string;
    title: string;
    description?: string;
    emissionRate?: number;
    severity?: string;
  }) => api.post<ApiResponse<Alert>>("/alerts", data).then((r) => r.data),

  markAllAlertsRead: () =>
    api.post<ApiResponse<null>>("/alerts/mark-read").then((r) => r.data),

  getUnreadAlertCount: () =>
    api.get<ApiResponse<{ count: number }>>("/alerts/unread-count").then((r) => r.data),

  setAlertThreshold: (minEmissionRate: number) =>
    api.post<ApiResponse<any>>("/settings/alert-threshold", { minEmissionRate }).then((r) => r.data),

  setEmailAlerts: (enabled: boolean) =>
    api.post<ApiResponse<any>>("/settings/email-alerts", { enabled }).then((r) => r.data),
};
