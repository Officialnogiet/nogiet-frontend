import React, { useState, useEffect } from 'react';
import { AuthScreen } from '../../types';
import { resetPasswordSchema } from '../../src/validations/auth.schema';
import { useResetPassword } from '../../src/hooks/useAuth';
import { useAuthStore } from '../../src/stores/auth.store';
import logoFull from '../../assets/logo-full.png';
import iconTeal from '../../assets/icon-teal.png';
import Footer from '../../components/Footer';
import EyeIcon from '../../components/auth/EyeIcon';

interface NewPasswordProps {
  onNavigate: (screen: AuthScreen) => void;
}

const NewPassword: React.FC<NewPasswordProps> = ({ onNavigate }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const resetEmail = useAuthStore((s) => s.resetEmail);
  const resetCode = useAuthStore((s) => s.resetCode);
  const resetMutation = useResetPassword();
  const [validationError, setValidationError] = useState<string>();

  useEffect(() => {
    if (!resetEmail || !resetCode) onNavigate(AuthScreen.FORGOT_PASSWORD);
  }, [resetEmail, resetCode, onNavigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(undefined);
    const result = resetPasswordSchema.safeParse({ email: resetEmail, code: resetCode, password, confirmPassword });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message);
      return;
    }
    resetMutation.mutate(result.data, {
      onSuccess: () => {
        useAuthStore.setState({ resetEmail: '', resetCode: '' });
        onNavigate(AuthScreen.SUCCESS);
      },
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="px-8 py-6">
        <img src={logoFull} alt="NOGIET" className="h-8 w-auto" />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm text-center space-y-8">
          <img src={iconTeal} alt="Reset" className="w-20 h-20 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Reset your password</h2>
            <p className="text-gray-500">Use at least 8 characters, including an uppercase letter and a number.</p>
          </div>
          {(validationError || resetMutation.isError) && (
            <p role="alert" className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{validationError ?? resetMutation.error?.message}</p>
          )}
          <form className="space-y-6 text-left" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">New password</label>
              <div className="relative">
                <input type={showPwd1 ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-5 pr-12 py-3 rounded-full border outline-none bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#009688]" />
                <button type="button" aria-label={showPwd1 ? "Hide new password" : "Show new password"} onClick={() => setShowPwd1(!showPwd1)} className="password-visibility-toggle absolute inset-y-0 right-3 flex w-10 items-center justify-center text-gray-400"><EyeIcon /></button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Confirm password</label>
              <div className="relative">
                <input type={showPwd2 ? "text" : "password"} required value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-5 pr-12 py-3 rounded-full border outline-none bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#009688]" />
                <button type="button" aria-label={showPwd2 ? "Hide confirm password" : "Show confirm password"} onClick={() => setShowPwd2(!showPwd2)} className="password-visibility-toggle absolute inset-y-0 right-3 flex w-10 items-center justify-center text-gray-400"><EyeIcon /></button>
              </div>
            </div>
            <button type="submit" disabled={resetMutation.isPending}
              className="nogiet-button nogiet-button-primary inline-flex w-full">
              {resetMutation.isPending ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NewPassword;
