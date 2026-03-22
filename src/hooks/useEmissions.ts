import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { emissionsApi } from "../api/emissions.api";
import { submitGroundDataSchema, emissionFiltersSchema } from "../validations/emission.schema";
import type { SubmitGroundDataInput, EmissionFiltersInput } from "../validations/emission.schema";

export function useFacilities() {
  return useQuery({
    queryKey: ["facilities"],
    queryFn: () => emissionsApi.getFacilities(),
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
    mutationFn: (data: { name: string; latitude: number; longitude: number; sector?: string; region?: string }) =>
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
