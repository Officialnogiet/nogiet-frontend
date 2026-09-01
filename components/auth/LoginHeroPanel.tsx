import React from 'react';
import loginBg from '../../assets/login-satellite-bg.jpg';

const LoginHeroPanel: React.FC = () => (
  <div className="hidden md:flex md:w-[56%] lg:w-[60%] relative flex-col overflow-hidden p-10 lg:p-12 text-white bg-[#020908]">
    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${loginBg})` }} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-black/10" />
    <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />
    <div className="flex-1" />
    <div className="relative z-10 mb-12 max-w-xl space-y-4">
      <span className="inline-flex rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-teal-200 backdrop-blur">National methane intelligence</span>
      <h1 className="text-5xl font-extrabold leading-[1.04] tracking-[-0.04em]">Hello, There!<br /><span className="text-teal-200">Welcome to NOGIET</span></h1>
      <p className="text-base font-medium text-gray-300">Nigerian Oil and Gas Methane Portal</p>
    </div>
    <div className="relative z-10 border-t border-white/15 pt-4 text-[10px] font-medium leading-relaxed text-gray-400">
      <p>&copy; 2026 NOGIET</p>
      <p className="mt-1 max-w-lg">Sponsored by the Stakeholder Democracy Network (SDN) with support from the Global Methane Hub</p>
      <div className="mt-3 flex gap-6">
        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
      </div>
    </div>
  </div>
);

export default LoginHeroPanel;
