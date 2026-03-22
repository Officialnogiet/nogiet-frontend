import React, { useState } from 'react';
import { useCreateAlert, useFacilities } from '../../src/hooks/useEmissions';
import type { Facility } from '../../src/api/emissions.api';

interface CreateAlertModalProps {
  darkMode: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const SEVERITIES = ['low', 'medium', 'high', 'critical'];

const CreateAlertModal: React.FC<CreateAlertModalProps> = ({ darkMode, onClose, onCreated }) => {
  const { data: facilities = [] } = useFacilities();
  const [facilityId, setFacilityId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emissionRate, setEmissionRate] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const mutation = useCreateAlert();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);
    if (!facilityId) { setFormError('Select a facility'); return; }
    if (!title.trim()) { setFormError('Title is required'); return; }

    mutation.mutate(
      {
        facilityId, title: title.trim(),
        description: description.trim() || undefined,
        emissionRate: emissionRate ? Number(emissionRate) : undefined,
        severity,
      },
      {
        onSuccess: () => {
          setSuccessMsg('Alert created successfully!');
          setTimeout(() => { onCreated?.(); onClose(); }, 800);
        },
        onError: (err: any) => setFormError(err.message ?? 'Failed to create alert'),
      }
    );
  };

  const inputCls = `w-full px-5 py-4 rounded-2xl border text-sm font-bold transition-all focus:ring-1 focus:ring-[#009688] outline-none ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-600' : 'bg-white border-gray-100 text-gray-900 placeholder-gray-400'}`;
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-6 animate-in fade-in duration-300">
      <div className={`w-full max-w-md rounded-[32px] shadow-3xl p-10 space-y-8 animate-in zoom-in-95 duration-300 border ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
        <div className="flex justify-between items-center">
          <h2 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create New Alert</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Facility</label>
            <div className="relative">
              <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)} className={selectCls}>
                <option value="">Select facility</option>
                {(facilities as Facility[]).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. High methane detected" className={inputCls} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Additional details..." className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Emission Rate (kg/hr)</label>
              <input type="number" step="0.01" min="0" value={emissionRate} onChange={(e) => setEmissionRate(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Severity</label>
              <div className="relative">
                <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectCls}>
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
          {formError && <p className="text-red-500 text-xs font-bold">{formError}</p>}
          {successMsg && <p className="text-teal-500 text-xs font-bold">{successMsg}</p>}
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className={`flex-1 py-4 border rounded-2xl font-extrabold text-sm transition-all ${darkMode ? 'bg-[#12161f] border-[#1e2430] text-gray-400 hover:bg-gray-800' : 'bg-white border-gray-100 text-gray-800 hover:bg-gray-50'}`}>Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-extrabold text-sm hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 disabled:opacity-50">
              {mutation.isPending ? 'Creating...' : 'Create Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAlertModal;
