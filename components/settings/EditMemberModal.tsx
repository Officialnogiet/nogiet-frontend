import React, { useState } from 'react';

const ROLES = [
  { label: 'Member', value: 'member' },
  { label: 'Admin', value: 'admin' },
  { label: 'Super Admin', value: 'super_admin' },
];

function displayRoleToValue(display: string): string {
  if (display === 'Super Admin') return 'super_admin';
  if (display === 'Admin') return 'admin';
  return 'member';
}

interface EditMemberModalProps {
  darkMode: boolean;
  member: { id: string; name: string; email: string; role: string };
  onClose: () => void;
  onSave: (id: string, data: { fullName?: string; email?: string; role?: string }) => void;
  isSaving?: boolean;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ darkMode, member, onClose, onSave, isSaving }) => {
  const [fullName, setFullName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [role, setRole] = useState(displayRoleToValue(member.role));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(member.id, { fullName: fullName.trim(), email: email.trim(), role });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-6 animate-in fade-in duration-300">
      <div className={`w-full max-w-md rounded-[32px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-[#12161f] border border-[#1e2430]' : 'bg-white border border-gray-100'}`}>
        <div className={`px-10 py-8 border-b flex justify-between items-center ${darkMode ? 'border-[#1e2430]' : 'border-gray-50'}`}>
          <h2 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Manage Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form className="p-10 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className={`w-full px-5 py-4 border rounded-2xl outline-none font-bold text-sm transition-all focus:ring-1 focus:ring-[#009688] ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white' : 'bg-white border-gray-100 text-gray-900'}`} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-5 py-4 border rounded-2xl outline-none font-bold text-sm transition-all focus:ring-1 focus:ring-[#009688] ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white' : 'bg-white border-gray-100 text-gray-900'}`} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Role</label>
            <div className="relative">
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className={`w-full px-5 py-4 border rounded-2xl outline-none font-bold text-sm appearance-none cursor-pointer transition-all focus:ring-1 focus:ring-[#009688] ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className={`px-8 py-3.5 border rounded-2xl font-extrabold text-sm transition-all ${darkMode ? 'bg-[#12161f] border-[#1e2430] text-gray-400 hover:bg-gray-800' : 'bg-white border-gray-100 text-gray-800 hover:bg-gray-50'}`}>Cancel</button>
            <button type="submit" disabled={isSaving} className="px-8 py-3.5 bg-[#009688] text-white rounded-2xl font-extrabold text-sm hover:bg-[#00796b] transition-all shadow-xl shadow-[#009688]/20 disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMemberModal;
