import React, { useState } from 'react';
import { AuthScreen } from '../../types';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetMutation.mutate({ email: resetEmail, code: resetCode, password, confirmPassword }, {
      onSuccess: () => onNavigate(AuthScreen.SUCCESS),
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
            <p className="text-gray-500">Create a new password to secure your account.</p>
          </div>
          {resetMutation.isError && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{resetMutation.error?.message}</p>
          )}
          <form className="space-y-6 text-left" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">New password</label>
              <div className="relative">
                <input type={showPwd1 ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border outline-none bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#009688]" />
                <button type="button" onClick={() => setShowPwd1(!showPwd1)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"><EyeIcon /></button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Confirm password</label>
              <div className="relative">
                <input type={showPwd2 ? "text" : "password"} required value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border outline-none bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#009688]" />
                <button type="button" onClick={() => setShowPwd2(!showPwd2)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"><EyeIcon /></button>
              </div>
            </div>
            <button type="submit" disabled={resetMutation.isPending}
              className="w-full bg-[#009688] text-white py-3.5 rounded-lg font-semibold hover:bg-[#00796b] transition-colors disabled:opacity-60">
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
