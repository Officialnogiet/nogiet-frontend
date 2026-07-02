import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { emissionsApi } from "../api/emissions.api";
import type { EmissionFilters, FacilityInput } from "../api/emissions.api";
import type { AnalyticsReportFilters } from "../api/emissions.api";
import { submitGroundDataSchema, emissionFiltersSchema } from "../validations/emission.schema";
import type { SubmitGroundDataInput, EmissionFiltersInput } from "../validations/emission.schema";
import {
  cacheFacilities, getCachedFacilities,
  cacheAlerts, getCachedAlerts,
  cacheEmissions, getCachedEmissions,
  queuePendingSubmission, isOffline,
} from "../utils/offline-storage";

const SATELLITE_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

export function useFacilities(filters?: Partial<EmissionFilters>) {
  return useQuery({
    queryKey: ["facilities", filters],
    queryFn: async () => {
      try {
        const res = await emissionsApi.getFacilities(filters);
        if (res.data && !filters) {
          cacheFacilities(res.data).catch(() => {});
        }
        return res;
      } catch (err) {
        if (isOffline() && !filters) {
          const cached = await getCachedFacilities();
          if (cached.length) return { data: cached };
        }
        throw err;
      }
    },
    select: (res) => res.data,
  });
}

export function useAlerts(limit = 20) {
  return useQuery({
    queryKey: ["alerts", limit],
    queryFn: async () => {
      try {
        const res = await emissionsApi.getAlerts(limit);
        if (res.data) {
          cacheAlerts(res.data).catch(() => {});
        }
        return res;
      } catch (err) {
        if (isOffline()) {
          const cached = await getCachedAlerts();
          if (cached.length) return { data: cached.slice(0, limit) };
        }
        throw err;
      }
    },
    select: (res) => res.data,
  });
}

export function useEmissionStats() {
  return useQuery({
    queryKey: ["emission-stats"],
    queryFn: () => emissionsApi.getStats(),
    select: (res) => res.data,
  });
}

export function useSatelliteSources(filters: EmissionFiltersInput) {
  return useQuery({
    queryKey: ["satellite-sources", filters],
    queryFn: async () => {
      const parsed = emissionFiltersSchema.parse(filters);
      const cacheKey = `sat-${JSON.stringify(parsed)}`;
      try {
        const res = await emissionsApi.getSatelliteSources(parsed);
        if (import.meta.env.DEV && res.data?.features?.length) {
          const counts: Record<string, number> = {};
          for (const f of res.data.features) {
            counts[f.provider] = (counts[f.provider] ?? 0) + 1;
          }
          console.log("[Satellite API] backend providers:", res.data.providers);
          console.log("[Satellite API] features by provider:", counts);
          for (const p of new Set(res.data.features.map((f) => f.provider))) {
            const sample = res.data.features.find((f) => f.provider === p);
            if (sample) console.log(`[Satellite API] normalized sample (${p}):`, sample);
          }
        }
        if (res.data) {
          cacheEmissions(cacheKey, res.data).catch(() => {});
        }
        return res;
      } catch (err) {
        if (isOffline()) {
          const cached = await getCachedEmissions(cacheKey);
          if (cached) return { data: cached };
        }
        throw err;
      }
    },
    select: (res) => res.data,
    enabled: !!filters,
    staleTime: SATELLITE_REFRESH_INTERVAL_MS,
    refetchInterval: SATELLITE_REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: false,
  });
}

export function useSatellitePlumes(sourceId: string) {
  return useQuery({
    queryKey: ["satellite-plumes", sourceId],
    queryFn: () => emissionsApi.getSatellitePlumes(sourceId),
    select: (res) => res.data,
    enabled: !!sourceId,
    staleTime: 10 * 60_000,
  });
}

export function useRefreshSatelliteRegion() {
  return useMutation({
    mutationFn: (filters: EmissionFiltersInput) => {
      const parsed = emissionFiltersSchema.parse(filters);
      return emissionsApi.refreshSatelliteRegion(parsed);
    },
  });
}

export function useGroundData(facilityId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["ground-data", facilityId, startDate, endDate],
    queryFn: () => emissionsApi.getGroundData(facilityId, startDate, endDate),
    select: (res) => res.data,
    enabled: !!facilityId,
  });
}

export function useComparisonData(facilityId: string, startDate?: string, endDate?: string, mode: string = "nearest", maxDistance?: number) {
  return useQuery({
    queryKey: ["comparison", facilityId, startDate, endDate, mode, maxDistance],
    queryFn: () => emissionsApi.getComparisonData(facilityId, startDate, endDate, mode, maxDistance),
    select: (res) => res.data,
    enabled: !!facilityId,
  });
}

export function useSubmitGroundData() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitGroundDataInput) => {
      const parsed = submitGroundDataSchema.parse(data);
      if (isOffline()) {
        await queuePendingSubmission(parsed);
        return { data: null, message: "Queued offline — will sync when online" };
      }
      return emissionsApi.submitGroundData(parsed);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ground-data"] });
      qc.invalidateQueries({ queryKey: ["comparison"] });
    },
  });
}

export function useCreateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FacilityInput & { name: string; latitude: number; longitude: number; subSector: "Upstream" | "Midstream" | "Downstream" }) =>
      emissionsApi.createFacility(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facilities"] });
      qc.invalidateQueries({ queryKey: ["emission-stats"] });
    },
  });
}

export function useUpdateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FacilityInput }) =>
      emissionsApi.updateFacility(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facilities"] });
      qc.invalidateQueries({ queryKey: ["facility-filter-options"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      qc.invalidateQueries({ queryKey: ["emission-aggregations"] });
      qc.invalidateQueries({ queryKey: ["analytics-report"] });
    },
  });
}

export function useDeleteFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emissionsApi.deleteFacility(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facilities"] });
      qc.invalidateQueries({ queryKey: ["emission-stats"] });
      qc.invalidateQueries({ queryKey: ["ground-data"] });
    },
  });
}

export function useUpdateFacilityThreshold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, threshold }: { id: string; threshold: number | null }) =>
      emissionsApi.updateFacilityThreshold(id, threshold),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facilities"] });
    },
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { facilityId: string; title: string; description?: string; emissionRate?: number; severity?: string }) =>
      emissionsApi.createAlert(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["unread-alert-count"] });
    },
  });
}

export function useUnreadAlertCount() {
  return useQuery({
    queryKey: ["unread-alert-count"],
    queryFn: () => emissionsApi.getUnreadAlertCount(),
    select: (res) => res.data?.count ?? 0,
    refetchInterval: 30_000,
  });
}

export function useMarkAllAlertsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => emissionsApi.markAllAlertsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unread-alert-count"] });
    },
  });
}

export function useSetAlertThreshold() {
  return useMutation({
    mutationFn: (minEmissionRate: number) => emissionsApi.setAlertThreshold(minEmissionRate),
  });
}

export function useSetEmailAlerts() {
  return useMutation({
    mutationFn: (enabled: boolean) => emissionsApi.setEmailAlerts(enabled),
  });
}

// Geofences
export function useGeofences() {
  return useQuery({
    queryKey: ["geofences"],
    queryFn: () => emissionsApi.getGeofences(),
    select: (res) => res.data,
  });
}

export function useCreateGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; geometry: any; alertEnabled?: boolean; threshold?: number }) =>
      emissionsApi.createGeofence(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geofences"] });
    },
  });
}

export function useUpdateGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; alertEnabled?: boolean; threshold?: number | null }) =>
      emissionsApi.updateGeofence(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geofences"] });
    },
  });
}

export function useDeleteGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emissionsApi.deleteGeofence(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geofences"] });
    },
  });
}

// Field Submissions
export function useFieldSubmissions(facilityId?: string) {
  return useQuery({
    queryKey: ["field-submissions", facilityId],
    queryFn: () => emissionsApi.getFieldSubmissions(facilityId),
    select: (res) => res.data,
  });
}

export function useCreateFieldSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      facilityId: string;
      photos?: string[];
      latitude: number;
      longitude: number;
      weatherConditions?: string;
      equipmentUsed?: string;
      notes?: string;
      methaneReading: number;
    }) => {
      if (isOffline()) {
        await queuePendingSubmission({ ...data, type: "field-submission" });
        return { data: null, message: "Queued offline — will sync when online" };
      }
      return emissionsApi.createFieldSubmission(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["field-submissions"] });
    },
  });
}

export function useReviewFieldSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      emissionsApi.reviewFieldSubmission(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["field-submissions"] });
    },
  });
}

// Dashboard
export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      try {
        const res = await emissionsApi.getDashboardSummary();
        if (res.data) {
          cacheEmissions("dashboard-summary", res.data).catch(() => {});
        }
        return res;
      } catch (err) {
        if (isOffline()) {
          const cached = await getCachedEmissions("dashboard-summary");
          if (cached) return { data: cached };
        }
        throw err;
      }
    },
    select: (res) => res.data,
    staleTime: SATELLITE_REFRESH_INTERVAL_MS,
    refetchInterval: SATELLITE_REFRESH_INTERVAL_MS,
  });
}

export function useFacilityFilterOptions() {
  return useQuery({
    queryKey: ["facility-filter-options"],
    queryFn: () => emissionsApi.getFacilityFilterOptions(),
    select: (res) => res.data,
    staleTime: 5 * 60_000,
  });
}

export function useEmissionAggregations() {
  return useQuery({
    queryKey: ["emission-aggregations"],
    queryFn: () => emissionsApi.getEmissionAggregations(),
    select: (res) => res.data,
    staleTime: SATELLITE_REFRESH_INTERVAL_MS,
    refetchInterval: SATELLITE_REFRESH_INTERVAL_MS,
  });
}

export function useAnalyticsReport(filters: AnalyticsReportFilters) {
  return useQuery({
    queryKey: ["analytics-report", filters],
    queryFn: () => emissionsApi.getAnalyticsReport(filters),
    select: (res) => res.data,
    staleTime: SATELLITE_REFRESH_INTERVAL_MS,
  });
}

export function useDataCompletenessAudit() {
  return useQuery({
    queryKey: ["data-completeness-audit"],
    queryFn: () => emissionsApi.getDataCompletenessAudit(),
    select: (res) => res.data,
    staleTime: SATELLITE_REFRESH_INTERVAL_MS,
    refetchInterval: SATELLITE_REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: false,
  });
}
