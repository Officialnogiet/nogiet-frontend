import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";

console.log(BASE_URL, "Base URL");

const AUTH_ROUTES = ["/auth/login", "/auth/forgot-password", "/auth/verify-code", "/auth/reset-password"];

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

function isAuthRoute(url?: string): boolean {
  if (!url) return false;
  return AUTH_ROUTES.some((route) => url.includes(route));
}

function buildApiError(error: AxiosError): ApiError {
  const message =
    (error.response?.data as any)?.message ?? error.message ?? "Request failed";
  return new ApiError(
    error.response?.status ?? 500,
    message,
    (error.response?.data as any)?.errors,
  );
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry || isAuthRoute(originalRequest.url)) {
      return Promise.reject(buildApiError(error));
    }

    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      return Promise.reject(buildApiError(error));
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const newAccess: string = data.data.accessToken;
      const newRefresh: string = data.data.refreshToken;

      localStorage.setItem("accessToken", newAccess);
      localStorage.setItem("refreshToken", newRefresh);

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      processQueue(null, newAccess);

      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      localStorage.clear();
      window.location.href = "/";
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
  }
}
