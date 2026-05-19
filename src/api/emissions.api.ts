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
  state?: string;
  lga?: string;
  oilBlock?: string;
  operator?: string;
  facilityType?: string;
  alertThreshold?: number | null;
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
  alertsThisWeek: number;
}

export interface EmissionFilters {
  startDate?: string;
  endDate?: string;
  sector?: string;
  gasType?: string;
  instrument?: string;
  provider?: string;
  minEmissionRate?: number;
  maxEmissionRate?: number;
  minPlumes?: number;
  maxPlumes?: number;
  minPersistence?: number;
  maxPersistence?: number;
  page?: number;
  limit?: number;
  bbox?: string;
  state?: string;
  lga?: string;
  oilBlock?: string;
  operator?: string;
  facilityType?: string;
}

export interface NormalizedSource {
  id: string;
  name: string;
  provider: "carbon_mapper" | "imeo" | "tropomi";
  latitude: number;
  longitude: number;
  emissionRate: number;
  gas: string;
  sector: string;
  instrument: string;
  persistence: number;
  plumeCount: number;
  firstDetected: string;
  lastDetected: string;
  metadata: Record<string, unknown>;
}

export interface SatelliteResponse {
  features: NormalizedSource[];
  total: number;
  providers: string[];
  source: "cache" | "api" | "error" | "none";
  error?: string;
}

export interface Geofence {
  id: string;
  userId: string;
  name: string;
  geometry: any;
  alertEnabled: boolean;
  threshold: number | null;
  createdAt: string;
}

export interface FieldSubmission {
  id: string;
  facilityId: string;
  submittedBy: string;
  photos: string[];
  latitude: number;
  longitude: number;
  weatherConditions?: string;
  equipmentUsed?: string;
  notes?: string;
  methaneReading: number;
  status: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalFacilities: number;
  totalMeasurements: number;
  alertsThisWeek: number;
  totalAlerts: number;
  activeSatelliteSources: number;
  totalSatelliteEmissionRate: number;
  providers: string[];
  recentAlerts: Alert[];
  topFacilities: { facilityId: string; facilityName: string; totalReading: number; measurementCount: number }[];
}

export interface FacilityFilterOptions {
  states: string[];
  lgas: string[];
  oilBlocks: string[];
  operators: string[];
  facilityTypes: string[];
}

export interface EmissionAggregations {
  byRegion: { region: string; count: number; avgReading: number }[];
  byOperator: { operator: string; count: number; avgReading: number }[];
  cumulativeByFacility: { facilityId: string; facilityName: string; totalEmission: number; count: number; latestDate: string }[];
}

export const emissionsApi = {
  getFacilities: (filters?: Partial<EmissionFilters>) =>
    api.get<ApiResponse<Facility[]>>("/facilities", { params: filters }).then((r) => r.data),

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
    api.get<ApiResponse<SatelliteResponse>>("/satellite/sources", { params: filters }).then((r) => r.data),

  refreshSatelliteRegion: (filters: EmissionFilters) =>
    api.get<ApiResponse<SatelliteResponse>>("/satellite/refresh", { params: filters }).then((r) => r.data),

  getSatellitePlumes: (sourceId: string) =>
    api.get<ApiResponse<any[]>>(`/satellite/plumes/${sourceId}`).then((r) => r.data),

  getImeoPlumeImageUrl: (plumeId: string) =>
    `/satellite/imeo/plume-image/${encodeURIComponent(plumeId)}`,

  getImeoLastUpdate: () =>
    api.get<ApiResponse<{ lastUpdate: string | null }>>("/satellite/imeo/last-update").then((r) => r.data),

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
    state?: string;
    lga?: string;
    oilBlock?: string;
    operator?: string;
    facilityType?: string;
  }) => api.post<ApiResponse<Facility>>("/facilities", data).then((r) => r.data),

  deleteFacility: (id: string) =>
    api.delete<ApiResponse<Facility>>(`/facilities/${id}`).then((r) => r.data),

  updateFacilityThreshold: (id: string, alertThreshold: number | null) =>
    api.put<ApiResponse<Facility>>(`/facilities/${id}/threshold`, { alertThreshold }).then((r) => r.data),

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

  // Geofences
  getGeofences: () =>
    api.get<ApiResponse<Geofence[]>>("/geofences").then((r) => r.data),

  createGeofence: (data: { name: string; geometry: any; alertEnabled?: boolean; threshold?: number }) =>
    api.post<ApiResponse<Geofence>>("/geofences", data).then((r) => r.data),

  updateGeofence: (id: string, data: { name?: string; alertEnabled?: boolean; threshold?: number | null }) =>
    api.put<ApiResponse<Geofence>>(`/geofences/${id}`, data).then((r) => r.data),

  deleteGeofence: (id: string) =>
    api.delete<ApiResponse<Geofence>>(`/geofences/${id}`).then((r) => r.data),

  // Field Submissions
  createFieldSubmission: (data: {
    facilityId: string;
    photos?: string[];
    latitude: number;
    longitude: number;
    weatherConditions?: string;
    equipmentUsed?: string;
    notes?: string;
    methaneReading: number;
  }) => api.post<ApiResponse<FieldSubmission>>("/field-submissions", data).then((r) => r.data),

  getFieldSubmissions: (facilityId?: string) =>
    api.get<ApiResponse<FieldSubmission[]>>("/field-submissions", { params: { facilityId } }).then((r) => r.data),

  reviewFieldSubmission: (id: string, status: "approved" | "rejected") =>
    api.put<ApiResponse<FieldSubmission>>(`/field-submissions/${id}/review`, { status }).then((r) => r.data),

  // Dashboard
  getDashboardSummary: () =>
    api.get<ApiResponse<DashboardSummary>>("/dashboard/summary").then((r) => r.data),

  getFacilityFilterOptions: () =>
    api.get<ApiResponse<FacilityFilterOptions>>("/facilities/filter-options").then((r) => r.data),

  getEmissionAggregations: () =>
    api.get<ApiResponse<EmissionAggregations>>("/emissions/aggregations").then((r) => r.data),
};
