
import React from 'react';

const Footer: React.FC<{ className?: string, darkMode?: boolean }> = ({ className = "", darkMode = true }) => {
  return (
    <footer className={`flex justify-between items-center px-8 py-6 text-sm transition-colors duration-300 text-gray-500 ${darkMode ? 'bg-[#0b0e14]' : 'bg-white'
      } md:bg-transparent ${className}`}>
      <div><p>© 2026 NOGIET</p><p className="mt-1 text-[10px]">Sponsored by the Stakeholder Democracy Network (SDN) with support from the Global Methane Hub</p></div>
      <div className="flex gap-6">
        <a href="#" className="hover:underline">Privacy Policy</a>
        <a href="#" className="hover:underline">Terms of Use</a>
      </div>
    </footer>
  );
};

export default Footer;
