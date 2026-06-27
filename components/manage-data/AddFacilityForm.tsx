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
const SUB_SECTORS = ['Upstream', 'Midstream', 'Downstream'] as const;
const REGIONS = ['South South', 'South West', 'South East', 'North Central', 'North West', 'North East'];
const GEO_LOCATIONS = ['Onshore', 'Offshore'] as const;

const AddFacilityForm: React.FC<AddFacilityFormProps> = ({ darkMode }) => {
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [sector, setSector] = useState('');
  const [region, setRegion] = useState('');
  const [subSector, setSubSector] = useState<typeof SUB_SECTORS[number] | ''>('');
  const [oilBlock, setOilBlock] = useState('');
  const [oilfield, setOilfield] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [operator, setOperator] = useState('');
  const [facilityType, setFacilityType] = useState('');
  const [geographicLocation, setGeographicLocation] = useState<typeof GEO_LOCATIONS[number] | ''>('');
  const [customField1, setCustomField1] = useState('');
  const [customField2, setCustomField2] = useState('');
  const [customField3, setCustomField3] = useState('');
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
    if (!subSector) { setFormError('Facilities Classification or Sub-Sector is required'); return; }

    mutation.mutate(
      {
        name: name.trim(),
        latitude: lat,
        longitude: lon,
        sector: sector || undefined,
        region: region || undefined,
        subSector,
        oilBlock: oilBlock.trim() || undefined,
        oilfield: oilfield.trim() || undefined,
        state: state.trim() || undefined,
        lga: lga.trim() || undefined,
        operator: operator.trim() || undefined,
        facilityType: facilityType.trim() || undefined,
        geographicLocation: geographicLocation || undefined,
        customField1: customField1.trim() || undefined,
        customField2: customField2.trim() || undefined,
        customField3: customField3.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSuccessMsg(`"${name}" added successfully`);
          setName(''); setLatitude(''); setLongitude(''); setSector(''); setRegion('');
          setSubSector(''); setOilBlock(''); setOilfield(''); setState(''); setLga('');
          setOperator(''); setFacilityType(''); setGeographicLocation('');
          setCustomField1(''); setCustomField2(''); setCustomField3('');
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
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Sub-Sector</label>
          <select value={subSector} onChange={(e) => setSubSector(e.target.value as typeof SUB_SECTORS[number] | '')} className={selectCls} required>
            <option value="">Select sub-sector</option>
            {SUB_SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Region</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={selectCls}>
            <option value="">Select region</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="State" value={state} onChange={setState} inputCls={inputCls} placeholder="e.g. Rivers" />
          <TextField label="LGA" value={lga} onChange={setLga} inputCls={inputCls} placeholder="e.g. Bonny" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Oil Block" value={oilBlock} onChange={setOilBlock} inputCls={inputCls} placeholder="e.g. OML 11" />
          <TextField label="Oilfield" value={oilfield} onChange={setOilfield} inputCls={inputCls} placeholder="e.g. Bomu" />
        </div>
        <TextField label="Operator" value={operator} onChange={setOperator} inputCls={inputCls} placeholder="e.g. NNPC" />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Facility Type" value={facilityType} onChange={setFacilityType} inputCls={inputCls} placeholder="e.g. Flow Station" />
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Location</label>
            <select value={geographicLocation} onChange={(e) => setGeographicLocation(e.target.value as typeof GEO_LOCATIONS[number] | '')} className={selectCls}>
              <option value="">Select location</option>
              {GEO_LOCATIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <TextField label="Custom Field 1" value={customField1} onChange={setCustomField1} inputCls={inputCls} placeholder="Additional facility info" />
        <TextField label="Custom Field 2" value={customField2} onChange={setCustomField2} inputCls={inputCls} placeholder="Additional facility info" />
        <TextField label="Custom Field 3" value={customField3} onChange={setCustomField3} inputCls={inputCls} placeholder="Additional facility info" />
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

const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputCls: string;
  placeholder?: string;
}> = ({ label, value, onChange, inputCls, placeholder }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
  </div>
);
