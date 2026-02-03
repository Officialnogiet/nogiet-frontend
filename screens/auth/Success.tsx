
import React from 'react';
import { AuthScreen } from '../../types';
import { Logo } from '../../components/Icons';
import Footer from '../../components/Footer';

interface SuccessProps {
  onNavigate: (screen: AuthScreen) => void;
}

const Success: React.FC<SuccessProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="px-8 py-6">
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8 text-black" />
          <span className="text-xl font-bold tracking-tight">NOGIET</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-[#009688] flex items-center justify-center">
              <Logo className="w-8 h-8 text-black" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Password Reset</h2>
            <p className="text-gray-500">Password successfully reset. Please sign in to continue</p>
          </div>

          <button
            onClick={() => onNavigate(AuthScreen.LOGIN)}
            className="w-full bg-[#009688] text-white py-3.5 rounded-lg font-semibold text-lg hover:bg-[#00796b] transition-colors shadow-sm"
          >
            Sign in
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Success;
