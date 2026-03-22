import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesApi } from "../api/roles.api";

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.getAll(),
    select: (res) => res.data,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: () => rolesApi.getPermissions(),
    select: (res) => res.data,
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ roleName, permissionIds }: { roleName: string; permissionIds: string[] }) =>
      rolesApi.updatePermissions(roleName, permissionIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}
