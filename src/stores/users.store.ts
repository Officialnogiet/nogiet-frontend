import { create } from "zustand";

type SettingsTab = "USER_MANAGEMENT" | "ROLE_MANAGEMENT";

interface UsersState {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  editingMember: any | null;
  setEditingMember: (member: any | null) => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  showSuccess: boolean;
  setShowSuccess: (show: boolean) => void;
  deletingMemberId: string | null;
  setDeletingMemberId: (id: string | null) => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  activeTab: "USER_MANAGEMENT",
  setActiveTab: (tab) => set({ activeTab: tab }),
  showAddModal: false,
  setShowAddModal: (show) => set({ showAddModal: show }),
  editingMember: null,
  setEditingMember: (member) => set({ editingMember: member }),
  showDeleteConfirm: false,
  setShowDeleteConfirm: (show) => set({ showDeleteConfirm: show }),
  showSuccess: false,
  setShowSuccess: (show) => set({ showSuccess: show }),
  deletingMemberId: null,
  setDeletingMemberId: (id) => set({ deletingMemberId: id }),
}));
