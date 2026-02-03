
import React from 'react';
import { AuthScreen } from '../../types';
import logoFull from '../../assets/logo-full.png';
import iconTeal from '../../assets/icon-teal.png';
import Footer from '../../components/Footer';

interface ForgotPasswordProps {
  onNavigate: (screen: AuthScreen) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src={logoFull} alt="NOGIET" className="h-8 w-auto" />
        </div>
        <div className="text-sm text-gray-600">
          Already have an account? <button onClick={() => onNavigate(AuthScreen.LOGIN)} className="text-[#009688] font-semibold hover:underline">Sign in</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm text-center space-y-8">
          <div className="flex justify-center">
            <img src={iconTeal} alt="Reset Password" className="w-20 h-20" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Reset your password</h2>
            <p className="text-gray-500 leading-relaxed">
              Enter your email address and we'll send you password reset instructions.
            </p>
          </div>

          <form className="space-y-6 text-left" onSubmit={(e) => {
            e.preventDefault();
            onNavigate(AuthScreen.VERIFY_CODE);
          }}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg border outline-none transition-colors bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#009688]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#009688] text-white py-3.5 rounded-lg font-semibold hover:bg-[#00796b] transition-colors"
            >
              Reset password
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
