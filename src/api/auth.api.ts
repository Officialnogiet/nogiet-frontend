import { api } from "./client";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface LoginResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: (email: string, password: string, rememberMe = false) =>
    api.post<ApiResponse<LoginResponse>>("/auth/login", { email, password, rememberMe })
      .then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<{ message: string }>>("/auth/forgot-password", { email })
      .then((r) => r.data),

  verifyCode: (email: string, code: string) =>
    api.post<ApiResponse<{ valid: boolean }>>("/auth/verify-code", { email, code })
      .then((r) => r.data),

  resetPassword: (email: string, code: string, password: string, confirmPassword: string) =>
    api.post<ApiResponse<{ message: string }>>("/auth/reset-password", {
      email, code, password, confirmPassword,
    }).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post<ApiResponse<{ message: string }>>("/auth/logout", { refreshToken })
      .then((r) => r.data),

  me: () =>
    api.get<ApiResponse<{ sub: string; email: string; role: string }>>("/auth/me")
      .then((r) => r.data),
};
