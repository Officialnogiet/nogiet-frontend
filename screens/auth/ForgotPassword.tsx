import React, { useState } from 'react';
import { AuthScreen } from '../../types';
import { useForgotPassword } from '../../src/hooks/useAuth';
import { forgotPasswordSchema } from '../../src/validations/auth.schema';
import { useAuthStore } from '../../src/stores/auth.store';
import logoFull from '../../assets/logo-full.png';
import iconTeal from '../../assets/icon-teal.png';
import Footer from '../../components/Footer';

interface ForgotPasswordProps {
  onNavigate: (screen: AuthScreen) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string>();
  const forgotMutation = useForgotPassword();
  const setResetEmail = useAuthStore((s) => s.setResetEmail);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(undefined);
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message);
      return;
    }
    setResetEmail(email);
    forgotMutation.mutate(email, {
      onSuccess: () => onNavigate(AuthScreen.VERIFY_CODE),
    });
  };

  const errorMessage = validationError ?? (forgotMutation.isError ? forgotMutation.error?.message : undefined);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="px-8 py-6 flex justify-between items-center">
        <img src={logoFull} alt="NOGIET" className="h-8 w-auto" />
        <div className="text-sm text-gray-600">
          Already have an account?{' '}
          <button onClick={() => onNavigate(AuthScreen.LOGIN)} className="text-[#009688] font-semibold hover:underline">Sign in</button>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm text-center space-y-8">
          <img src={iconTeal} alt="Reset" className="w-20 h-20 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Reset your password</h2>
            <p className="text-gray-500 leading-relaxed">Enter your email address and we'll send you password reset instructions.</p>
          </div>
          {errorMessage && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{errorMessage}</p>
          )}
          <form className="space-y-6 text-left" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg border outline-none bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#009688]" />
            </div>
            <button type="submit" disabled={forgotMutation.isPending}
              className="w-full bg-[#009688] text-white py-3.5 rounded-lg font-semibold hover:bg-[#00796b] transition-colors disabled:opacity-60">
              {forgotMutation.isPending ? 'Sending...' : 'Reset password'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
