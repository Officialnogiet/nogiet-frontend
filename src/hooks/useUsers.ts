import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api/users.api";
import { createUserSchema, updateUserSchema } from "../validations/user.schema";
import type { CreateUserInput, UpdateUserInput } from "../validations/user.schema";

export function useUsers(page = 1, limit = 10, search?: string) {
  return useQuery({
    queryKey: ["users", page, limit, search],
    queryFn: () => usersApi.getAll(page, limit, search),
    select: (res) => res.data,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserInput) => {
      const parsed = createUserSchema.parse(data);
      return usersApi.create(parsed);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) => {
      const parsed = updateUserSchema.parse(data);
      return usersApi.update(id, parsed);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
