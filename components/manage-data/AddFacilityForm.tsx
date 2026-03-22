import React, { useState } from 'react';
import { useCreateFacility } from '../../src/hooks/useEmissions';

interface AddFacilityFormProps {
  darkMode: boolean;
}

const SECTORS = [
  'Oil and Gas',
  // 'Refinery',
  // 'Coal Mining',
  // 'Waste Management',
  // 'Agriculture',
  // 'Power Generation',
];
const REGIONS = ['South South', 'South West', 'South East', 'North Central', 'North West', 'North East'];

const AddFacilityForm: React.FC<AddFacilityFormProps> = ({ darkMode }) => {
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [sector, setSector] = useState('');
  const [region, setRegion] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const mutation = useCreateFacility();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);
    if (!name.trim()) { setFormError('Name is required'); return; }
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) { setFormError('Latitude must be between -90 and 90'); return; }
    if (isNaN(lon) || lon < -180 || lon > 180) { setFormError('Longitude must be between -180 and 180'); return; }

    mutation.mutate(
      { name: name.trim(), latitude: lat, longitude: lon, sector: sector || undefined, region: region || undefined },
      {
        onSuccess: () => {
          setSuccessMsg(`"${name}" added successfully`);
          setName(''); setLatitude(''); setLongitude(''); setSector(''); setRegion('');
        },
        onError: (err: any) => setFormError(err.message ?? 'Failed to create facility'),
      }
    );
  };

  const inputCls = `w-full px-5 py-4 rounded-2xl border text-sm font-bold transition-all focus:ring-1 focus:ring-[#009688] outline-none ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-700' : 'bg-[#f9faf9] border-gray-100 placeholder-gray-400 text-gray-900'}`;
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  return (
    <div className={`rounded-[32px] shadow-sm p-10 space-y-6 border transition-colors ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-50'}`}>
      <div>
        <h3 className={`font-extrabold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>New Facility</h3>
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Add a new monitoring facility to the map.</p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Warri Refinery" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Latitude</label>
            <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g. 5.5167" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Longitude</label>
            <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g. 5.7333" className={inputCls} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Sector</label>
          <select value={sector} onChange={(e) => setSector(e.target.value)} className={selectCls}>
            <option value="">Select sector</option>
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Region</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={selectCls}>
            <option value="">Select region</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {formError && <p className="text-red-500 text-xs font-bold">{formError}</p>}
        {successMsg && <p className="text-teal-500 text-xs font-bold">{successMsg}</p>}
        <button type="submit" disabled={mutation.isPending}
          className="w-full bg-[#009688] text-white py-4 rounded-2xl font-extrabold hover:bg-[#00796b] transition-all shadow-xl shadow-[#009688]/20 text-base disabled:opacity-50">
          {mutation.isPending ? 'Creating...' : 'Add Facility'}
        </button>
      </form>
    </div>
  );
};

export default AddFacilityForm;
