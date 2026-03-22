import React, { useState } from 'react';
import { useCreateAlert } from '../../src/hooks/useEmissions';
import type { Facility } from '../../src/api/emissions.api';

interface AddAlertFormProps {
  darkMode: boolean;
  facilities: Facility[];
  onCreated?: () => void;
}

const SEVERITIES = ['low', 'medium', 'high', 'critical'];

const AddAlertForm: React.FC<AddAlertFormProps> = ({ darkMode, facilities, onCreated }) => {
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
          setSuccessMsg('Alert created! Redirecting...');
          setTitle(''); setDescription(''); setEmissionRate('');
          setTimeout(() => onCreated?.(), 1000);
        },
        onError: (err: any) => setFormError(err.message ?? 'Failed to create alert'),
      }
    );
  };

  const inputCls = `w-full px-5 py-4 rounded-2xl border text-sm font-bold transition-all focus:ring-1 focus:ring-[#009688] outline-none ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-700' : 'bg-[#f9faf9] border-gray-100 placeholder-gray-400 text-gray-900'}`;
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  return (
    <div className={`rounded-[32px] shadow-sm p-10 space-y-6 border transition-colors ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-50'}`}>
      <div>
        <h3 className={`font-extrabold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>New Alert</h3>
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Create an emission alert for a facility.</p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Facility</label>
          <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)} className={selectCls}>
            <option value="">Select facility</option>
            {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. High methane detected" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Description (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Additional details..." className={`${inputCls} resize-none`} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Emission Rate (kg/hr)</label>
            <input type="number" step="0.01" min="0" value={emissionRate} onChange={(e) => setEmissionRate(e.target.value)} placeholder="0.00" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectCls}>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        {formError && <p className="text-red-500 text-xs font-bold">{formError}</p>}
        {successMsg && <p className="text-teal-500 text-xs font-bold">{successMsg}</p>}
        <button type="submit" disabled={mutation.isPending}
          className="w-full bg-red-600 text-white py-4 rounded-2xl font-extrabold hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 text-base disabled:opacity-50">
          {mutation.isPending ? 'Creating...' : 'Create Alert'}
        </button>
      </form>
    </div>
  );
};

export default AddAlertForm;
