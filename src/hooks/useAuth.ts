import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../stores/auth.store";
import { loginSchema, forgotPasswordSchema, verifyCodeSchema, resetPasswordSchema } from "../validations/auth.schema";
import type { LoginInput, ResetPasswordInput } from "../validations/auth.schema";

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (input: LoginInput) => {
      const parsed = loginSchema.parse(input);
      return authApi.login(parsed.email, parsed.password, parsed.rememberMe);
    },
    onSuccess: (res) => {
      const { user, accessToken, refreshToken } = res.data;
      setUser(user, accessToken, refreshToken);
    },
  });
}

export function useForgotPassword() {
  const setResetEmail = useAuthStore((s) => s.setResetEmail);

  return useMutation({
    mutationFn: (email: string) => {
      const parsed = forgotPasswordSchema.parse({ email });
      return authApi.forgotPassword(parsed.email);
    },
    onSuccess: (_, email) => setResetEmail(email),
  });
}

export function useVerifyCode() {
  const setResetCode = useAuthStore((s) => s.setResetCode);

  return useMutation({
    mutationFn: (input: { email: string; code: string }) => {
      const parsed = verifyCodeSchema.parse(input);
      return authApi.verifyCode(parsed.email, parsed.code);
    },
    onSuccess: (_, { code }) => setResetCode(code),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => {
      const parsed = resetPasswordSchema.parse(input);
      return authApi.resetPassword(parsed.email, parsed.code, parsed.password, parsed.confirmPassword);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: () => {
      const refreshToken = localStorage.getItem("refreshToken") ?? "";
      return authApi.logout(refreshToken);
    },
    onSettled: () => logout(),
  });
}
