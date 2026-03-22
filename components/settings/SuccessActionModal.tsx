import React from 'react';

interface SuccessActionModalProps {
  darkMode: boolean;
  onClose: () => void;
}

const SuccessActionModal: React.FC<SuccessActionModalProps> = ({ darkMode, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[130] p-6 animate-in fade-in duration-300">
    <div className={`w-full max-w-sm rounded-[32px] shadow-3xl p-10 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300 border ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center relative bg-[#009688]/10">
        <div className="absolute inset-0 rounded-full border-2 opacity-50 border-[#009688]/20" />
        <svg className="w-10 h-10 text-[#009688]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>
      </div>
      <div className="space-y-2">
        <h2 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Success!</h2>
        <p className="text-sm font-bold leading-relaxed text-gray-500">Team member action processed successfully</p>
      </div>
      <button onClick={onClose} className="w-full py-4 bg-[#009688] text-white rounded-2xl font-extrabold text-sm hover:bg-[#00796b] transition-all shadow-xl shadow-[#009688]/20 mt-4">
        Continue
      </button>
    </div>
  </div>
);

export default SuccessActionModal;
