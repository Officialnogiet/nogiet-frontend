import React, { useState } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

interface AddMemberModalProps {
  darkMode: boolean;
  onClose: () => void;
  onSubmit: (data: { fullName: string; email: string; role: string; tempPassword?: string }) => Promise<void> | void;
  isSaving?: boolean;
}

const ROLES = [
  { label: 'Admin', value: 'admin' },
  { label: 'Regulator', value: 'regulator' },
  { label: 'Facility Owner (Field Agent)', value: 'facility_owner' },
  { label: 'Viewer', value: 'viewer' },
  { label: 'Super Admin', value: 'super_admin' },
];

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pw = '';
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ darkMode, onClose, onSubmit, isSaving }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [useTempPassword, setUseTempPassword] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  const handleGeneratePassword = () => {
    const pw = generateTempPassword();
    setTempPassword(pw);
    setUseTempPassword(true);
  };

  const handleCopy = () => {
    const pw = createdPassword || tempPassword;
    navigator.clipboard.writeText(pw).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !email.trim() || !role) {
      setError('All fields are required');
      return;
    }
    try {
      await onSubmit({
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        ...(useTempPassword && tempPassword ? { tempPassword } : {}),
      });
      if (useTempPassword && tempPassword) {
        setCreatedPassword(tempPassword);
      }
    } catch { /* handled upstream */ }
  };

  const inputClass = `w-full px-5 py-4 border rounded-2xl outline-none font-bold text-sm transition-all focus:ring-1 focus:ring-[#009688] ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-600' : 'bg-white border-gray-100 text-gray-900 placeholder-gray-400'}`;

  if (createdPassword) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-6 animate-in fade-in duration-300">
        <div className={`w-full max-w-md rounded-[32px] shadow-3xl p-10 space-y-6 animate-in zoom-in-95 duration-300 border ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-[#009688]" />
            <h2 className={`mt-4 text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>User Created</h2>
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Share the temporary password below with the new user for their first login.
            </p>
          </div>
          <div className={`rounded-xl border p-4 ${darkMode ? 'border-[#1e2430] bg-[#0b0e14]' : 'border-gray-200 bg-gray-50'}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Temporary Password</p>
            <div className="flex items-center gap-2">
              <code className={`flex-1 rounded-lg px-3 py-2 font-mono text-sm ${darkMode ? 'bg-[#1a1f2b] text-teal-400' : 'bg-white text-teal-700'}`}>{createdPassword}</code>
              <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg bg-[#009688] px-3 py-2 text-xs font-bold text-white hover:bg-[#00796b] transition">
                {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className={`mt-2 text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              The user should change this password after their first login.
            </p>
          </div>
          <button onClick={onClose} className="w-full py-4 bg-[#009688] text-white rounded-2xl font-extrabold text-sm hover:bg-[#00796b] transition-all shadow-xl shadow-[#009688]/20">
            Done
          </button>
        </div>
      </div>
    );
  }

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
            <input type="text" placeholder="Enter full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
            <input type="email" placeholder="Enter email address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Role</label>
            <div className="relative">
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className={`${inputClass} appearance-none cursor-pointer ${!role ? (darkMode ? 'text-gray-600' : 'text-gray-400') : ''}`}>
                <option value="">Select role</option>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </div>
            {role === 'facility_owner' && (
              <p className={`text-[10px] mt-1 ${darkMode ? 'text-amber-400/70' : 'text-amber-700'}`}>
                Field agents can only access the Field Data form. They must log in to submit reports.
              </p>
            )}
          </div>

          {/* Temporary password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Temporary Password</label>
              <button type="button" onClick={handleGeneratePassword}
                className="text-[10px] font-bold text-[#009688] hover:text-[#00796b] transition uppercase tracking-wider">
                Generate
              </button>
            </div>
            {useTempPassword ? (
              <div className="flex items-center gap-2">
                <input type="text" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)}
                  className={inputClass} placeholder="Temp password" />
                <button type="button" onClick={handleCopy}
                  className="flex-shrink-0 rounded-xl bg-[#009688]/10 p-3 text-[#009688] hover:bg-[#009688]/20 transition">
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            ) : (
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Click "Generate" to set a temporary password. If not set, a random password will be emailed to the user.
              </p>
            )}
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
