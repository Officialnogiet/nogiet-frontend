import React, { useState, useEffect } from 'react';
import { AuthScreen } from '../../types';
import { useVerifyCode } from '../../src/hooks/useAuth';
import { useAuthStore } from '../../src/stores/auth.store';
import logoFull from '../../assets/logo-full.png';
import Footer from '../../components/Footer';

interface VerifyCodeProps {
  onNavigate: (screen: AuthScreen) => void;
}

const VerifyCode: React.FC<VerifyCodeProps> = ({ onNavigate }) => {
  const [codes, setCodes] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(3540);
  const resetEmail = useAuthStore((s) => s.resetEmail);
  const verifyMutation = useVerifyCode();

  useEffect(() => {
    const interval = setInterval(() => setTimer((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleInput = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const next = [...codes];
    next[index] = value;
    setCodes(next);
    if (value && index < 5) document.getElementById(`code-${index + 1}`)?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  const handleVerify = () => {
    const code = codes.join('');
    verifyMutation.mutate({ email: resetEmail, code }, {
      onSuccess: () => onNavigate(AuthScreen.NEW_PASSWORD),
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="px-8 py-6">
        <img src={logoFull} alt="NOGIET" className="h-8 w-auto" />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-lg text-center space-y-12">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-gray-900">Enter verification code</h2>
            <p className="text-gray-500">We have sent a verification code to your email</p>
          </div>
          {verifyMutation.isError && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{verifyMutation.error?.message}</p>
          )}
          <div className="flex justify-center gap-3">
            {codes.map((code, idx) => (
              <input key={idx} id={`code-${idx}`} type="text" value={code}
                onChange={(e) => handleInput(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none bg-white border-gray-200 text-gray-900 focus:border-[#009688]" />
            ))}
          </div>
          <div className="space-y-6">
            <button onClick={handleVerify} disabled={verifyMutation.isPending || codes.some(c => !c)}
              className="w-full max-w-sm bg-[#009688] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#00796b] transition-colors disabled:opacity-60">
              {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
            </button>
            <p className="text-sm text-gray-500">Resend code in <span className="text-[#009688] font-semibold">{formatTime(timer)}</span></p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VerifyCode;
