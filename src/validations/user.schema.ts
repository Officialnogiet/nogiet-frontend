import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  tempPassword: z.string().min(6).optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.string().min(1).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
