
import React, { useState } from 'react';
import { AuthScreen } from '../../types';
import logoFull from '../../assets/logo-full.png';
import iconTeal from '../../assets/icon-teal.png';
import Footer from '../../components/Footer';

interface NewPasswordProps {
  onNavigate: (screen: AuthScreen) => void;
}

const NewPassword: React.FC<NewPasswordProps> = ({ onNavigate }) => {
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="px-8 py-6">
        <div className="flex items-center gap-2">
          <img src={logoFull} alt="NOGIET" className="h-8 w-auto" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm text-center space-y-8">
          <div className="flex justify-center">
            <img src={iconTeal} alt="Reset Password" className="w-20 h-20" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Reset your password</h2>
            <p className="text-gray-500">Create a new password to secure your account.</p>
          </div>

          <form className="space-y-6 text-left" onSubmit={(e) => {
            e.preventDefault();
            onNavigate(AuthScreen.SUCCESS);
          }}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Reset password</label>
              <div className="relative">
                <input
                  type={showPwd1 ? "text" : "password"}
                  defaultValue="••••••••••"
                  className="w-full px-4 py-3 rounded-lg border outline-none transition-colors bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#009688]"
                />
                <button type="button" onClick={() => setShowPwd1(!showPwd1)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Confirm password</label>
              <div className="relative">
                <input
                  type={showPwd2 ? "text" : "password"}
                  defaultValue="••••••••••"
                  className="w-full px-4 py-3 rounded-lg border outline-none transition-colors bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#009688]"
                />
                <button type="button" onClick={() => setShowPwd2(!showPwd2)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#009688] text-white py-3.5 rounded-lg font-semibold hover:bg-[#00796b] transition-colors shadow-sm"
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

export default NewPassword;
