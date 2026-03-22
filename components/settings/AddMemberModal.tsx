import React, { useState } from 'react';

interface AddMemberModalProps {
  darkMode: boolean;
  onClose: () => void;
  onSubmit: (data: { fullName: string; email: string; role: string }) => void;
  isSaving?: boolean;
}

const ROLES = [
  { label: 'Member', value: 'member' },
  { label: 'Admin', value: 'admin' },
  { label: 'Super Admin', value: 'super_admin' },
];

const AddMemberModal: React.FC<AddMemberModalProps> = ({ darkMode, onClose, onSubmit, isSaving }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !email.trim() || !role) {
      setError('All fields are required');
      return;
    }
    onSubmit({ fullName: fullName.trim(), email: email.trim(), role });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-6 animate-in fade-in duration-300">
      <div className={`w-full max-w-md rounded-[32px] shadow-3xl p-10 space-y-8 animate-in zoom-in-95 duration-300 border ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
        <div className="flex justify-between items-center">
          <h2 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create New Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
            <input type="text" placeholder="Enter full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className={`w-full px-5 py-4 border rounded-2xl outline-none font-bold text-sm transition-all focus:ring-1 focus:ring-[#009688] ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-600' : 'bg-white border-gray-100 text-gray-900 placeholder-gray-400'}`} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
            <input type="email" placeholder="Enter email address" value={email} onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-5 py-4 border rounded-2xl outline-none font-bold text-sm transition-all focus:ring-1 focus:ring-[#009688] ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-600' : 'bg-white border-gray-100 text-gray-900 placeholder-gray-400'}`} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Role</label>
            <div className="relative">
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className={`w-full px-5 py-4 border rounded-2xl outline-none font-bold text-sm appearance-none cursor-pointer transition-all focus:ring-1 focus:ring-[#009688] ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white' : 'bg-white border-gray-100 text-gray-900'} ${!role ? (darkMode ? 'text-gray-600' : 'text-gray-400') : ''}`}>
                <option value="">Select role</option>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className={`flex-1 py-4 border rounded-2xl font-extrabold text-sm transition-all ${darkMode ? 'bg-[#12161f] border-[#1e2430] text-gray-400 hover:bg-gray-800' : 'bg-white border-gray-100 text-gray-800 hover:bg-gray-50'}`}>Cancel</button>
            <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-[#009688] text-white rounded-2xl font-extrabold text-sm hover:bg-[#00796b] transition-all shadow-xl shadow-[#009688]/20 disabled:opacity-50">
              {isSaving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
