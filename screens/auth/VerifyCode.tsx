
import React, { useState, useEffect } from 'react';
import { AuthScreen } from '../../types';
import logoFull from '../../assets/logo-full.png';
import Footer from '../../components/Footer';

interface VerifyCodeProps {
  onNavigate: (screen: AuthScreen) => void;
}

const VerifyCode: React.FC<VerifyCodeProps> = ({ onNavigate }) => {
  const [codes, setCodes] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(3540); // 59:00 in seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInput = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newCodes = [...codes];
    newCodes[index] = value;
    setCodes(newCodes);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="px-8 py-6">
        <div className="flex items-center gap-2">
          <img src={logoFull} alt="NOGIET" className="h-8 w-auto" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-lg text-center space-y-12">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-gray-900">Enter verification code</h2>
            <p className="text-gray-500">We have sent a verification code to email address</p>
          </div>

          <div className="flex justify-center gap-3">
            {codes.map((code, idx) => (
              <input
                key={idx}
                id={`code-${idx}`}
                type="text"
                value={code}
                onChange={(e) => handleInput(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all focus:outline-none bg-white border-gray-200 text-gray-900 focus:border-[#009688]"
                placeholder={idx >= 3 ? "" : ""}
              />
            ))}
          </div>

          <div className="space-y-6">
            <button
              onClick={() => onNavigate(AuthScreen.NEW_PASSWORD)}
              className="w-full max-w-sm bg-[#009688] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#00796b] transition-colors"
            >
              Verify
            </button>

            <p className="text-sm text-gray-500">
              Resend code in <span className="text-[#009688] font-semibold">{formatTime(timer)}</span>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VerifyCode;
