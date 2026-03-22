import React from 'react';
import loginBg from '../../assets/login-bg.png';

const LoginHeroPanel: React.FC = () => (
  <div className="hidden md:flex md:w-[42%] lg:w-[40%] relative flex-col p-12 text-white bg-[#111827]">
    <div className="absolute inset-0 opacity-50 bg-cover bg-center" style={{ backgroundImage: `url(${loginBg})` }} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    <div className="flex-1" />
    <div className="relative z-10 space-y-4 mb-20">
      <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight">Hello, There!<br />Welcome to NOGIET</h1>
      <p className="text-xl text-gray-300 font-medium">Nigerian Oil and Gas Methane Portal</p>
    </div>
    <div className="relative z-10 flex justify-between text-xs text-gray-400 font-medium">
      <span>&copy; 2026 NOGIET</span>
      <div className="flex gap-6">
        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
      </div>
    </div>
  </div>
);

export default LoginHeroPanel;
