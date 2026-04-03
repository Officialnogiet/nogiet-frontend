import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EmissionUnit } from "../utils/unit-conversion";

interface SettingsState {
  emailAlerts: boolean;
  pushNotifications: boolean;
  alertThreshold: number;
  dataRetention: string;
  exportFormat: string;
  defaultRegion: string;
  mapStyle: "dark" | "light" | "satellite";
  emissionUnit: EmissionUnit;

  setEmailAlerts: (v: boolean) => void;
  setPushNotifications: (v: boolean) => void;
  setAlertThreshold: (v: number) => void;
  setDataRetention: (v: string) => void;
  setExportFormat: (v: string) => void;
  setDefaultRegion: (v: string) => void;
  setMapStyle: (v: "dark" | "light" | "satellite") => void;
  setEmissionUnit: (v: EmissionUnit) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      emailAlerts: true,
      pushNotifications: true,
      alertThreshold: 20,
      dataRetention: "24 hours",
      exportFormat: "CSV",
      defaultRegion: "Niger Delta",
      mapStyle: "dark",
      emissionUnit: "kg/hr",

      setEmailAlerts: (v) => set({ emailAlerts: v }),
      setPushNotifications: (v) => set({ pushNotifications: v }),
      setAlertThreshold: (v) => set({ alertThreshold: v }),
      setDataRetention: (v) => set({ dataRetention: v }),
      setExportFormat: (v) => set({ exportFormat: v }),
      setDefaultRegion: (v) => set({ defaultRegion: v }),
      setMapStyle: (v) => set({ mapStyle: v }),
      setEmissionUnit: (v) => set({ emissionUnit: v }),
    }),
    {
      name: "nogiet-settings",
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version < 2 && persisted?.defaultRegion === "Nigeria (Full)") {
          persisted.defaultRegion = "Niger Delta";
        }
        return persisted;
      },
    },
  ),
);
