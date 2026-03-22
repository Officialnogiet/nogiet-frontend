import React, { useState, useMemo, useEffect } from 'react';
import type { Facility } from '../../src/api/emissions.api';

interface GroundDataFormProps {
  darkMode: boolean;
  facilities: Facility[];
  selectedFacilityId: string;
  onFacilityChange: (id: string) => void;
  onSubmit: (data: {
    facilityId: string;
    measurementDate: string;
    methaneReading: number;
    methodology: string;
    latitude: number;
    longitude: number;
  }) => void;
  isSubmitting: boolean;
  compact?: boolean;
}

const RANGE_KM = 2;
const KM_TO_DEG_LAT = 1 / 111.32;
const kmToLonDeg = (lat: number) => 1 / (111.32 * Math.cos((lat * Math.PI) / 180));

const GroundDataForm: React.FC<GroundDataFormProps> = ({
  darkMode, facilities, selectedFacilityId, onFacilityChange, onSubmit, isSubmitting, compact,
}) => {
  const [date, setDate] = useState('');
  const [reading, setReading] = useState('');
  const [methodology, setMethodology] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedFacility = useMemo(
    () => facilities.find((f) => f.id === selectedFacilityId),
    [facilities, selectedFacilityId],
  );

  const latRange = useMemo(() => {
    if (!selectedFacility) return { min: 0, max: 0, center: 0 };
    const offset = RANGE_KM * KM_TO_DEG_LAT;
    return { min: +(selectedFacility.latitude - offset).toFixed(6), max: +(selectedFacility.latitude + offset).toFixed(6), center: selectedFacility.latitude };
  }, [selectedFacility]);

  const lonRange = useMemo(() => {
    if (!selectedFacility) return { min: 0, max: 0, center: 0 };
    const offset = RANGE_KM * kmToLonDeg(selectedFacility.latitude);
    return { min: +(selectedFacility.longitude - offset).toFixed(6), max: +(selectedFacility.longitude + offset).toFixed(6), center: selectedFacility.longitude };
  }, [selectedFacility]);

  const [lat, setLat] = useState(latRange.center);
  const [lon, setLon] = useState(lonRange.center);

  useEffect(() => { setLat(latRange.center); setLon(lonRange.center); }, [latRange.center, lonRange.center]);

  const handleFormSubmit = (e: React.FormEvent) => {
    setSuccess(false);
    e.preventDefault();
    setFormError(null);
    if (!selectedFacilityId) { setFormError('Select a facility'); return; }
    if (!date) { setFormError('Pick a date'); return; }
    if (!reading || Number(reading) <= 0) { setFormError('Enter a valid reading'); return; }
    if (!methodology) { setFormError('Select a methodology'); return; }
    onSubmit({
      facilityId: selectedFacilityId,
      measurementDate: new Date(date).toISOString(),
      methaneReading: Number(reading),
      methodology,
      latitude: +lat.toFixed(6),
      longitude: +lon.toFixed(6),
    });
    setDate(''); setReading(''); setMethodology('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all focus:ring-1 focus:ring-[#009688] outline-none ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-700' : 'bg-[#f9faf9] border-gray-100 placeholder-gray-400 text-gray-900'}`;
  const selectCls = `${inputCls} appearance-none cursor-pointer`;
  const labelCls = 'text-[10px] font-bold text-gray-500 uppercase tracking-widest';

  const latPct = latRange.max !== latRange.min ? ((lat - latRange.min) / (latRange.max - latRange.min)) * 100 : 50;
  const lonPct = lonRange.max !== lonRange.min ? ((lon - lonRange.min) / (lonRange.max - lonRange.min)) * 100 : 50;

  if (compact) {
    return (
      <form className="space-y-3" onSubmit={handleFormSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelCls}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Reading (kg/hr)</label>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={reading} onChange={e => setReading(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Methodology</label>
          <select value={methodology} onChange={e => setMethodology(e.target.value)} className={selectCls}>
            <option value="">Select method</option>
            <option value="OGI Camera">OGI Camera</option>
            <option value="Sniffer Drone">Sniffer Drone</option>
            <option value="Fixed Sensor">Fixed Sensor</option>
          </select>
        </div>
        {selectedFacility && (
          <div className={`rounded-xl p-3 border space-y-3 ${darkMode ? 'bg-[#0b0e14] border-[#1e2430]' : 'bg-[#f9faf9] border-gray-100'}`}>
            <p className={`text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              Location <span className="normal-case tracking-normal font-medium">(within {RANGE_KM}km)</span>
            </p>
            <MiniSlider label="Lat" value={lat} min={latRange.min} max={latRange.max} pct={latPct} onChange={setLat} darkMode={darkMode} />
            <MiniSlider label="Lon" value={lon} min={lonRange.min} max={lonRange.max} pct={lonPct} onChange={setLon} darkMode={darkMode} />
          </div>
        )}
        {formError && <p className="text-red-500 text-[10px] font-bold">{formError}</p>}
        {success && <p className="text-teal-500 text-[10px] font-bold">Submitted</p>}
        <button type="submit" disabled={isSubmitting}
          className="w-full bg-[#009688] text-white py-2.5 rounded-xl font-bold text-xs hover:bg-[#00796b] transition-all disabled:opacity-50">
          {isSubmitting ? 'Submitting...' : 'Submit Measurement'}
        </button>
      </form>
    );
  }

  return (
    <div className="w-full lg:w-[430px]">
      <div className={`rounded-[32px] shadow-sm px-4 pt-12 space-y-8 border transition-colors duration-300 ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-50'}`}>
        <div>
          <h3 className={`font-extrabold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Input Ground Data</h3>
          <p className={`text-xs mt-2 font-bold uppercase tracking-tight ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Manually enter facility measurements.</p>
        </div>
        <form className="space-y-6" onSubmit={handleFormSubmit}>
          <div className="space-y-2">
            <label className={labelCls}>Facility</label>
            <select value={selectedFacilityId} onChange={e => onFacilityChange(e.target.value)} className={selectCls}>
              <option value="">Select facility</option>
              {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Measurement Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Methane Reading (kg/hr)</label>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={reading} onChange={e => setReading(e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Methodology</label>
            <select value={methodology} onChange={e => setMethodology(e.target.value)} className={selectCls}>
              <option value="">Select method</option>
              <option value="OGI Camera">OGI Camera</option>
              <option value="Sniffer Drone">Sniffer Drone</option>
              <option value="Fixed Sensor">Fixed Sensor</option>
            </select>
          </div>
          {selectedFacility && (
            <div className={`space-y-5 rounded-2xl p-5 border ${darkMode ? 'bg-[#0b0e14] border-[#1e2430]' : 'bg-[#f9faf9] border-gray-100'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                Measurement Location <span className="normal-case tracking-normal font-medium">(within {RANGE_KM}km of facility)</span>
              </p>
              <MiniSlider label="Latitude" value={lat} min={latRange.min} max={latRange.max} pct={latPct} onChange={setLat} darkMode={darkMode} />
              <MiniSlider label="Longitude" value={lon} min={lonRange.min} max={lonRange.max} pct={lonPct} onChange={setLon} darkMode={darkMode} />
            </div>
          )}
          {formError && <p className="text-red-500 text-xs font-bold">{formError}</p>}
          {success && <p className="text-teal-500 text-xs font-bold">Data submitted successfully</p>}
          <button type="submit" disabled={isSubmitting}
            className="w-full bg-[#009688] text-white py-4 rounded-2xl font-extrabold hover:bg-[#00796b] transition-all shadow-xl shadow-[#009688]/20 mt-4 text-base tracking-tight disabled:opacity-50">
            {isSubmitting ? 'Submitting...' : 'Submit Data'}
          </button>
        </form>
      </div>
    </div>
  );
};

const MiniSlider: React.FC<{
  label: string; value: number; min: number; max: number; pct: number;
  onChange: (v: number) => void; darkMode: boolean;
}> = ({ label, value, min, max, pct, onChange, darkMode }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      <span className={`text-[10px] font-mono font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>{value.toFixed(6)}°</span>
    </div>
    <div className="relative h-5 flex items-center">
      <div className={`absolute inset-x-0 h-1.5 rounded-full ${darkMode ? 'bg-[#1e2430]' : 'bg-gray-200'}`} />
      <div className="absolute h-1.5 rounded-full bg-gradient-to-r from-teal-500 to-teal-400"
        style={{ left: `${Math.min(pct, 50)}%`, width: `${Math.abs(pct - 50)}%` }} />
      <input type="range" min={min} max={max} step={0.000001} value={value} onChange={e => onChange(+e.target.value)}
        className="absolute inset-x-0 w-full h-5 opacity-0 cursor-pointer z-10" />
      <div className="absolute w-3 h-3 rounded-full bg-teal-500 border-2 border-white shadow-md pointer-events-none"
        style={{ left: `calc(${pct}% - 6px)` }} />
    </div>
    <div className="flex justify-between text-[8px] text-gray-500 font-mono">
      <span>{min}°</span><span>{max}°</span>
    </div>
  </div>
);

export default GroundDataForm;
