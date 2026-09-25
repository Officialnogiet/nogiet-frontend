import React from 'react';
import loginBg from '../../assets/login-satellite-bg.jpg';

const LoginHeroPanel: React.FC = () => (
  <div className="hidden md:flex md:w-[40%] md:shrink-0 relative flex-col overflow-hidden p-7 lg:p-10 text-white bg-[#0a0a0a]">
    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${loginBg})` }} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-black/10" />
    <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />
    <div className="relative z-10 mt-[clamp(8rem,24vh,15rem)] max-w-xl space-y-3">
      <h1 className="text-3xl lg:text-4xl font-semibold leading-[1.12] tracking-[-0.035em] text-[#d6eee2]">Welcome to NOGIET</h1>
      <p className="max-w-sm text-sm leading-6 font-medium text-[#d9e4e1]">The Nigerian Oil and Gas Industry Emission Tracker</p>
    </div>
    <div className="relative z-10 mt-auto border-t border-white/20 pt-4 text-[10px] font-medium leading-relaxed text-neutral-300">
      <p>&copy; {new Date().getFullYear()} NOGIET</p>
      <p className="mt-1 max-w-lg">Sponsored by the Stakeholder Democracy Network (SDN) with support from the Global Methane Hub</p>
    </div>
  </div>
);

export default LoginHeroPanel;
