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
  subSector?: "Upstream" | "Midstream" | "Downstream";
  oilBlock?: string;
  oilfield?: string;
  operator?: string;
  facilityType?: string;
  geographicLocation?: "Onshore" | "Offshore";
  customField1?: string;
  customField2?: string;
  customField3?: string;
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
  subSector?: "Upstream" | "Midstream" | "Downstream";
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
  subSectors: string[];
}

export interface FacilityInput {
  name?: string;
  latitude?: number;
  longitude?: number;
  sector?: string;
  region?: string;
  state?: string;
  lga?: string;
  subSector?: "Upstream" | "Midstream" | "Downstream";
  oilBlock?: string;
  oilfield?: string;
  operator?: string;
  facilityType?: string;
  geographicLocation?: "Onshore" | "Offshore";
  customField1?: string;
  customField2?: string;
  customField3?: string;
  alertThreshold?: number | null;
}

export interface OilBlockOverride {
  blockId: string;
  updatedBy: string;
  updatedAt: string;
  properties: {
    name?: string;
    type?: string;
    status?: string;
    operator?: string;
    terrain?: string;
    basin?: string;
    area_sqkm?: string;
    award_date?: string;
    contract?: string;
    rights?: string;
  };
}

export interface UpdateOilBlockOverrideInput {
  name?: string;
  type?: string;
  status?: string;
  operator?: string;
  terrain?: string;
  basin?: string;
  areaSqkm?: string;
  awardDate?: string;
  contract?: string;
  rights?: string;
}

export interface EmissionAggregations {
  byRegion: { region: string; count: number; avgReading: number }[];
  byOperator: { operator: string; count: number; avgReading: number }[];
  cumulativeByFacility: { facilityId: string; facilityName: string; totalEmission: number; count: number; latestDate: string }[];
}

export interface AnalyticsReportFilters {
  startDate?: string;
  endDate?: string;
  period?: "monthly" | "yearly";
  subSector?: "Upstream" | "Midstream" | "Downstream";
  source?: "satellite" | "ground" | "combined";
  provider?: "carbon_mapper" | "imeo" | "tropomi";
}

export interface AnalyticsReport {
  filters: Record<string, string>;
  totals: {
    satelliteEmission: number;
    groundEmission: number;
    combinedEmission: number;
    satelliteCount: number;
    groundCount: number;
  };
  rows: {
    period: string;
    subSector: string;
    satelliteEmission: number;
    groundEmission: number;
    combinedEmission: number;
    satelliteCount: number;
    groundCount: number;
  }[];
  satelliteRows: any[];
  groundRows: any[];
}

export interface DataCompletenessAudit {
  generatedAt: string;
  summary: {
    configuredSatelliteProviders: number;
    activeSatelliteProviders: number;
    satelliteDetections: number;
    satelliteEmissionRate: number;
    facilities: number;
    groundMeasurements: number;
    facilitiesWithGroundData: number;
  };
  providers: {
    provider: "carbon_mapper" | "imeo" | "tropomi";
    configured: boolean;
    sourceCount: number;
    totalEmissionRate: number;
    latestDetection: string | null;
    status: "active" | "configured_no_data" | "not_configured";
  }[];
  facilityMetadata: {
    key: string;
    label: string;
    count: number;
    missing: number;
    coveragePercent: number;
  }[];
  groundMeasurements: {
    total: number;
    facilitiesWithGroundData: number;
    bySubSector: {
      subSector: string;
      measurementCount: number;
      facilityCount: number;
    }[];
  };
  integrationCandidates: {
    name: string;
    category: string;
    status: "active" | "configured_no_data" | "not_configured";
    action: string;
  }[];
  gaps: {
    severity: "low" | "medium" | "high";
    item: string;
    recommendation: string;
  }[];
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

  createFacility: (data: FacilityInput & { name: string; latitude: number; longitude: number; subSector: "Upstream" | "Midstream" | "Downstream" }) =>
    api.post<ApiResponse<Facility>>("/facilities", data).then((r) => r.data),

  updateFacility: (id: string, data: FacilityInput) =>
    api.put<ApiResponse<Facility>>(`/facilities/${id}`, data).then((r) => r.data),

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

  getOilBlockOverrides: () =>
    api.get<ApiResponse<OilBlockOverride[]>>("/oil-block-overrides").then((r) => r.data),

  updateOilBlockOverride: (blockId: string, data: UpdateOilBlockOverrideInput) =>
    api.put<ApiResponse<OilBlockOverride>>(`/oil-block-overrides/${encodeURIComponent(blockId)}`, data).then((r) => r.data),

  getEmissionAggregations: () =>
    api.get<ApiResponse<EmissionAggregations>>("/emissions/aggregations").then((r) => r.data),

  getAnalyticsReport: (filters: AnalyticsReportFilters) =>
    api.get<ApiResponse<AnalyticsReport>>("/analytics/report", { params: filters }).then((r) => r.data),

  getDataCompletenessAudit: () =>
    api.get<ApiResponse<DataCompletenessAudit>>("/emissions/completeness").then((r) => r.data),
};
