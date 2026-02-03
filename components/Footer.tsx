
import React from 'react';

const Footer: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <footer className={`flex justify-between items-center px-8 py-6 text-sm text-gray-500 bg-white md:bg-transparent ${className}`}>
      <div>© 2026 NOGIET</div>
      <div className="flex gap-6">
        <a href="#" className="hover:underline">Privacy Policy</a>
        <a href="#" className="hover:underline">Terms of Use</a>
      </div>
    </footer>
  );
};

export default Footer;
