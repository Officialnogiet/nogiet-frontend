import { create } from "zustand";

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  resetEmail: string;
  setResetEmail: (email: string) => void;
  resetCode: string;
  setResetCode: (code: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  })(),
  isAuthenticated: !!localStorage.getItem("accessToken"),

  setUser: (user, accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    set({ user: null, isAuthenticated: false });
  },

  resetEmail: "",
  setResetEmail: (email) => set({ resetEmail: email }),
  resetCode: "",
  setResetCode: (code) => set({ resetCode: code }),
}));
