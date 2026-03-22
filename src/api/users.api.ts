import { api } from "./client";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface PaginatedUsers {
  data: User[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const usersApi = {
  getAll: (page = 1, limit = 10, search?: string) =>
    api.get<ApiResponse<PaginatedUsers>>("/users", { params: { page, limit, search } })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<User>>(`/users/${id}`).then((r) => r.data),

  create: (data: { fullName: string; email: string; role: string }) =>
    api.post<ApiResponse<User>>("/users", data).then((r) => r.data),

  update: (id: string, data: Partial<{ fullName: string; email: string; role: string }>) =>
    api.patch<ApiResponse<User>>(`/users/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/users/${id}`).then((r) => r.data),
};
