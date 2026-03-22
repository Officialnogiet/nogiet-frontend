import { api } from "./client";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: { id: string; name: string; description: string }[];
}

export const rolesApi = {
  getAll: () =>
    api.get<ApiResponse<Role[]>>("/roles").then((r) => r.data),

  updatePermissions: (roleName: string, permissionIds: string[]) =>
    api.put<ApiResponse<Role>>(`/roles/${roleName}/permissions`, { permissionIds })
      .then((r) => r.data),

  getPermissions: () =>
    api.get<ApiResponse<{ id: string; name: string; description: string }[]>>("/permissions")
      .then((r) => r.data),
};
