import { create } from "zustand";
import type { DashboardView } from "../../types";

interface DashboardState {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isFilterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  selectedFacility: any | null;
  setSelectedFacility: (facility: any | null) => void;
  isExpanded: boolean;
  setExpanded: (expanded: boolean) => void;
  showAlerts: boolean;
  toggleAlerts: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeView: "DASHBOARD_HOME",
  setActiveView: (view) => set({ activeView: view, isFilterOpen: false }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  isFilterOpen: false,
  setFilterOpen: (open) => set({ isFilterOpen: open }),
  darkMode: false,
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  selectedFacility: null,
  setSelectedFacility: (facility) => set({ selectedFacility: facility }),
  isExpanded: false,
  setExpanded: (expanded) => set({ isExpanded: expanded }),
  showAlerts: false,
  toggleAlerts: () => set((s) => ({ showAlerts: !s.showAlerts })),
}));
