import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  emailAlerts: boolean;
  pushNotifications: boolean;
  alertThreshold: number;
  dataRetention: string;
  exportFormat: string;
  defaultRegion: string;
  mapStyle: "dark" | "light" | "satellite";

  setEmailAlerts: (v: boolean) => void;
  setPushNotifications: (v: boolean) => void;
  setAlertThreshold: (v: number) => void;
  setDataRetention: (v: string) => void;
  setExportFormat: (v: string) => void;
  setDefaultRegion: (v: string) => void;
  setMapStyle: (v: "dark" | "light" | "satellite") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      emailAlerts: true,
      pushNotifications: true,
      alertThreshold: 20,
      dataRetention: "24 hours",
      exportFormat: "CSV",
      defaultRegion: "Nigeria (Full)",
      mapStyle: "dark",

      setEmailAlerts: (v) => set({ emailAlerts: v }),
      setPushNotifications: (v) => set({ pushNotifications: v }),
      setAlertThreshold: (v) => set({ alertThreshold: v }),
      setDataRetention: (v) => set({ dataRetention: v }),
      setExportFormat: (v) => set({ exportFormat: v }),
      setDefaultRegion: (v) => set({ defaultRegion: v }),
      setMapStyle: (v) => set({ mapStyle: v }),
    }),
    { name: "nogiet-settings" },
  ),
);
