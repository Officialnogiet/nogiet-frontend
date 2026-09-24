import React, { useState, useEffect } from 'react';
import { AuthScreen } from '../../types';
import { useVerifyCode, useForgotPassword } from '../../src/hooks/useAuth';
import { useAuthStore } from '../../src/stores/auth.store';
import logoFull from '../../assets/logo-full.png';
import Footer from '../../components/Footer';

interface VerifyCodeProps {
  onNavigate: (screen: AuthScreen) => void;
}

const VerifyCode: React.FC<VerifyCodeProps> = ({ onNavigate }) => {
  const [codes, setCodes] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const resetEmail = useAuthStore((s) => s.resetEmail);
  const verifyMutation = useVerifyCode();
  const resendMutation = useForgotPassword();

  useEffect(() => {
    if (!resetEmail) onNavigate(AuthScreen.FORGOT_PASSWORD);
  }, [resetEmail, onNavigate]);

  const resendCode = () => {
    verifyMutation.reset();
    resendMutation.mutate(resetEmail, { onSuccess: () => { setTimer(60); setCodes(['', '', '', '', '', '']); } });
  };

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
    value = value.replace(/\D/g, '').slice(-1);
    const next = [...codes];
    next[index] = value;
    setCodes(next);
    if (value && index < 5) document.getElementById(`code-${index + 1}`)?.focus();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    event.preventDefault();
    setCodes(Array.from({ length: 6 }, (_, index) => digits[index] ?? ''));
    document.getElementById(`code-${Math.min(digits.length, 5)}`)?.focus();
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
            <p className="text-gray-500">If an account exists for {resetEmail}, a code has been sent. Codes expire after one hour.</p>
          </div>
          {(verifyMutation.isError || resendMutation.isError) && (
            <p role="alert" className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{verifyMutation.error?.message ?? resendMutation.error?.message}</p>
          )}
          <div className="mx-auto grid w-full max-w-sm grid-cols-6 gap-2 sm:gap-3">
            {codes.map((code, idx) => (
              <input key={idx} id={`code-${idx}`} type="text" inputMode="numeric" autoComplete={idx === 0 ? "one-time-code" : "off"} aria-label={`Code digit ${idx + 1}`} value={code}
                onPaste={handlePaste}
                onChange={(e) => handleInput(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-full min-w-0 h-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none bg-white border-gray-200 text-gray-900 focus:border-[#009688]" />
            ))}
          </div>
          <div className="space-y-6">
            <button onClick={handleVerify} disabled={verifyMutation.isPending || resendMutation.isPending || codes.some(c => !c)}
              className="nogiet-button nogiet-button-primary inline-flex w-full max-w-sm">
              {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
            </button>
            <div>
              <button type="button" onClick={resendCode} disabled={timer > 0 || resendMutation.isPending || verifyMutation.isPending} className="text-sm font-semibold text-primary-dark hover:underline disabled:opacity-60">
                {resendMutation.isPending ? 'Sending code...' : timer > 0 ? `Resend code in ${formatTime(timer)}` : 'Resend code'}
              </button>
              {resendMutation.isSuccess && <p role="status" className="mt-3 text-sm text-gray-500">If an account exists, a new code has been sent. Use the most recent code.</p>}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VerifyCode;
