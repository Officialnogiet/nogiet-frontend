import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { emissionsApi } from "../api/emissions.api";
import type { EmissionFilters } from "../api/emissions.api";
import { submitGroundDataSchema, emissionFiltersSchema } from "../validations/emission.schema";
import type { SubmitGroundDataInput, EmissionFiltersInput } from "../validations/emission.schema";

export function useFacilities(filters?: Partial<EmissionFilters>) {
  return useQuery({
    queryKey: ["facilities", filters],
    queryFn: () => emissionsApi.getFacilities(filters),
    select: (res) => res.data,
  });
}

export function useAlerts(limit = 20) {
  return useQuery({
    queryKey: ["alerts", limit],
    queryFn: () => emissionsApi.getAlerts(limit),
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
    queryFn: () => {
      const parsed = emissionFiltersSchema.parse(filters);
      return emissionsApi.getSatelliteSources(parsed);
    },
    select: (res) => res.data,
    enabled: !!filters,
    staleTime: 2 * 60_000,
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
    mutationFn: (data: SubmitGroundDataInput) => {
      const parsed = submitGroundDataSchema.parse(data);
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
    mutationFn: (data: { name: string; latitude: number; longitude: number; sector?: string; region?: string; state?: string; lga?: string; oilBlock?: string; operator?: string; facilityType?: string }) =>
      emissionsApi.createFacility(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facilities"] });
      qc.invalidateQueries({ queryKey: ["emission-stats"] });
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
    mutationFn: (data: {
      facilityId: string;
      photos?: string[];
      latitude: number;
      longitude: number;
      weatherConditions?: string;
      equipmentUsed?: string;
      notes?: string;
      methaneReading: number;
    }) => emissionsApi.createFieldSubmission(data),
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
    queryFn: () => emissionsApi.getDashboardSummary(),
    select: (res) => res.data,
    staleTime: 60_000,
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
    staleTime: 2 * 60_000,
  });
}
