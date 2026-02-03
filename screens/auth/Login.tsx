import React, { useState } from 'react';
import { AuthScreen } from '../../types';
import { Logo } from '../../components/Icons';
import loginBg from '../../assets/login-bg.png';
import logoFull from '../../assets/logo-full.png';

interface LoginProps {
  onNavigate: (screen: AuthScreen) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate a successful login by navigating to the dashboard
    onNavigate(AuthScreen.DASHBOARD);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      {/* Left Panel: Hero Section */}
      <div className="hidden md:flex md:w-[42%] lg:w-[40%] bg-[#111827] relative flex-col p-12 text-white">
        <div
          className="absolute inset-0 opacity-50 bg-cover bg-center"
          style={{ backgroundImage: `url(${loginBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />


        {/* Top left logo removed */}


        <div className="flex-1" />

        <div className="relative z-10 space-y-4 mb-20">
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight">
            Hello, There!<br />
            Welcome to NOGIET
          </h1>
          <p className="text-xl text-gray-300 font-medium">Nigerian Oil and Gas Methane Portal</p>
        </div>

        <div className="relative z-10 flex justify-between text-xs text-gray-400 font-medium">
          <span>© 2026 NOGIET</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-20 bg-white">
        <div className="w-full max-w-[440px]">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-center mb-12">
            <img src={logoFull} alt="NOGIET" className="h-8 w-auto" />
          </div>

          <div className="flex justify-center mb-8">
            {/* Centered Logo for Desktop if needed, though design shows it top right or hidden? 
                 Actually design shows "NOGIET" logo at top center of RIGHT panel in the image?
                 Wait, looking at the image provided: 
                 Left side: Dark with chimney.
                 Right side: "NOGIET" logo at TOP (centered horizontally in the right panel).
                 Then "Welcome" content centered vertically.
             */}
            <div className="hidden md:flex flex-col items-center gap-3 mb-12">
              <img src={logoFull} alt="NOGIET" className="h-10 w-auto" />
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                Welcome 🚀
              </h2>
              <p className="text-gray-500 text-sm">Sign in to your dashboard</p>
            </div>

            <form className="space-y-6" onSubmit={handleSignIn}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-500">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#009688] focus:border-[#009688] transition-all text-gray-900 placeholder-gray-300"
                  placeholder="name@mail.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-500">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#009688] focus:border-[#009688] transition-all text-gray-900 placeholder-gray-300 tracking-widest"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer sr-only" defaultChecked />
                    <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded text-white peer-checked:bg-[#009688] peer-checked:border-[#009688] flex items-center justify-center transition-all">
                      <svg className="w-3 h-3 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm text-gray-900 font-medium">Keep me logged in</span>
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate(AuthScreen.FORGOT_PASSWORD)}
                  className="text-sm text-[#006E66] font-bold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-[#009688] text-white py-3 rounded-lg font-medium text-sm hover:bg-[#00796b] transform transition-all shadow-none"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Login;
