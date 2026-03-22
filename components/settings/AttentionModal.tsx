import React from 'react';

interface AttentionModalProps {
  darkMode: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

const AttentionModal: React.FC<AttentionModalProps> = ({ darkMode, onCancel, onConfirm, isDeleting }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[120] p-6 animate-in fade-in duration-300">
    <div className={`w-full max-w-sm rounded-[32px] shadow-3xl p-10 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300 border ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
      <div className={`w-20 h-20 rounded-full flex items-center justify-center relative ${darkMode ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
        <div className={`absolute inset-0 rounded-full border-2 opacity-50 ${darkMode ? 'border-orange-500/20' : 'border-orange-100'}`} />
        <svg className="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      </div>
      <div className="space-y-2">
        <h2 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Attention</h2>
        <p className="text-sm font-bold leading-relaxed text-gray-500">Are you sure you want to delete this team member?</p>
      </div>
      <div className="flex gap-4 w-full pt-4">
        <button onClick={onCancel} className={`flex-1 py-4 border rounded-2xl font-extrabold text-sm transition-all ${darkMode ? 'bg-[#12161f] border-[#1e2430] text-gray-400 hover:bg-gray-800' : 'bg-white border-gray-100 text-gray-800 hover:bg-gray-50'}`}>Cancel</button>
        <button onClick={onConfirm} disabled={isDeleting} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-extrabold text-sm hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 disabled:opacity-50">{isDeleting ? 'Deleting...' : 'Delete'}</button>
      </div>
    </div>
  </div>
);

export default AttentionModal;
