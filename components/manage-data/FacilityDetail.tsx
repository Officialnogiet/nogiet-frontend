import React, { useState } from 'react';
import { ArrowLeft, Trash2, Plus, MapPin, Calendar, FlaskConical } from 'lucide-react';
import type { Facility } from '../../src/api/emissions.api';
import { useGroundData, useDeleteFacility, useSubmitGroundData } from '../../src/hooks/useEmissions';

interface Props {
  darkMode: boolean;
  facility: Facility;
  onBack: () => void;
}

const RANGE_KM = 2;
const KM_TO_DEG_LAT = 1 / 111.32;
const kmToLonDeg = (lat: number) => 1 / (111.32 * Math.cos((lat * Math.PI) / 180));

const FacilityDetail: React.FC<Props> = ({ darkMode, facility, onBack }) => {
  const { data: groundData = [], isLoading } = useGroundData(facility.id);
  const deleteMutation = useDeleteFacility();
  const submitMutation = useSubmitGroundData();

  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [date, setDate] = useState('');
  const [reading, setReading] = useState('');
  const [methodology, setMethodology] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const latOffset = RANGE_KM * KM_TO_DEG_LAT;
  const lonOffset = RANGE_KM * kmToLonDeg(facility.latitude);
  const latMin = +(facility.latitude - latOffset).toFixed(6);
  const latMax = +(facility.latitude + latOffset).toFixed(6);
  const lonMin = +(facility.longitude - lonOffset).toFixed(6);
  const lonMax = +(facility.longitude + lonOffset).toFixed(6);
  const [lat, setLat] = useState(facility.latitude);
  const [lon, setLon] = useState(facility.longitude);

  const handleDelete = () => {
    deleteMutation.mutate(facility.id, { onSuccess: () => onBack() });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!date) { setFormError('Pick a date'); return; }
    if (!reading || Number(reading) <= 0) { setFormError('Enter a valid reading'); return; }
    if (!methodology) { setFormError('Select a methodology'); return; }
    submitMutation.mutate(
      { facilityId: facility.id, measurementDate: new Date(date).toISOString(), methaneReading: Number(reading), methodology, latitude: +lat.toFixed(6), longitude: +lon.toFixed(6) },
      { onSuccess: () => { setShowAdd(false); setDate(''); setReading(''); setMethodology(''); setLat(facility.latitude); setLon(facility.longitude); } },
    );
  };

  const card = `rounded-[32px] shadow-sm p-10 border transition-colors ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-50'}`;
  const inputCls = `w-full px-5 py-4 rounded-2xl border text-sm font-bold transition-all focus:ring-1 focus:ring-[#009688] outline-none ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-700' : 'bg-[#f9faf9] border-gray-100 placeholder-gray-400 text-gray-900'}`;
  const selectCls = `${inputCls} appearance-none cursor-pointer ${darkMode ? 'text-gray-500 focus:text-white' : 'text-gray-400 focus:text-gray-900'}`;
  const labelCls = 'text-[11px] font-bold text-gray-400 uppercase tracking-widest';
  const valCls = `text-xs font-mono font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`;
  const sliderTrack = darkMode ? 'bg-[#1e2430]' : 'bg-gray-200';

  const latPct = latMax !== latMin ? ((lat - latMin) / (latMax - latMin)) * 100 : 50;
  const lonPct = lonMax !== lonMin ? ((lon - lonMin) / (lonMax - lonMin)) * 100 : 50;

  return (
    <div className={card}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-[#1e2430]' : 'hover:bg-gray-100'}`}>
          <ArrowLeft size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className={`font-extrabold text-lg truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{facility.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${darkMode ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-700'}`}>{facility.sector}</span>
            {facility.region && <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{facility.region}</span>}
            <span className={`text-[11px] font-mono ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}</span>
          </div>
        </div>
        <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors" title="Delete facility">
          <Trash2 size={18} />
        </button>
      </div>

      {confirmDelete && (
        <div className={`mb-6 p-5 rounded-2xl border ${darkMode ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-sm font-bold ${darkMode ? 'text-red-300' : 'text-red-700'}`}>Delete this facility and all its ground data?</p>
          <div className="flex gap-3 mt-3">
            <button onClick={handleDelete} disabled={deleteMutation.isPending}
              className="px-5 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50">
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button onClick={() => setConfirmDelete(false)} className={`px-5 py-2 rounded-xl text-sm font-bold ${darkMode ? 'bg-[#1e2430] text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h4 className={`font-bold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Ground Measurements <span className={`ml-1 text-xs font-normal ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>({(groundData as any[]).length})</span>
        </h4>
        <button onClick={() => setShowAdd(!showAdd)}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${showAdd ? (darkMode ? 'bg-[#1e2430] text-gray-400' : 'bg-gray-100 text-gray-500') : 'bg-teal-600 text-white hover:bg-teal-700'}`}>
          <Plus size={14} /> {showAdd ? 'Cancel' : 'Add Data'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className={`mb-6 p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#0b0e14]/60 border-[#1e2430]' : 'bg-gray-50 border-gray-100'}`}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Methane (kg/hr)</label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={reading} onChange={(e) => setReading(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Methodology</label>
            <select value={methodology} onChange={(e) => setMethodology(e.target.value)} className={selectCls}>
              <option value="">Select method</option>
              <option value="OGI Camera">OGI Camera</option>
              <option value="Sniffer Drone">Sniffer Drone</option>
              <option value="Fixed Sensor">Fixed Sensor</option>
            </select>
          </div>

          <div className={`space-y-4 rounded-2xl p-4 border ${darkMode ? 'bg-[#0b0e14] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              Measurement Location <span className="normal-case tracking-normal font-medium">(within {RANGE_KM}km)</span>
            </p>
            {renderSlider('Latitude', lat, setLat, latMin, latMax, latPct, valCls, labelCls, sliderTrack)}
            {renderSlider('Longitude', lon, setLon, lonMin, lonMax, lonPct, valCls, labelCls, sliderTrack)}
          </div>

          {formError && <p className="text-red-500 text-xs font-bold">{formError}</p>}
          <button type="submit" disabled={submitMutation.isPending}
            className="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold hover:bg-teal-700 transition-all disabled:opacity-50 text-sm">
            {submitMutation.isPending ? 'Submitting...' : 'Submit Measurement'}
          </button>
        </form>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Loading measurements...</p>
          </div>
        ) : (groundData as any[]).length === 0 ? (
          <p className={`text-sm text-center py-8 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>No ground data yet. Click "Add Data" above.</p>
        ) : (
          (groundData as any[]).map((gd: any, i: number) => (
            <div key={gd.id ?? i} className={`p-4 rounded-2xl border transition-colors ${darkMode ? 'bg-[#0b0e14]/40 border-[#1e2430]' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical size={14} className="text-teal-500" />
                  <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{Number(gd.methaneReading).toFixed(2)} kg/hr</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${darkMode ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-700'}`}>{gd.methodology}</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className={`text-xs flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Calendar size={11} /> {gd.measurementDate ? new Date(gd.measurementDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
                {gd.latitude != null && (
                  <span className={`text-xs flex items-center gap-1 font-mono ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    <MapPin size={11} /> {Number(gd.latitude).toFixed(4)}, {Number(gd.longitude).toFixed(4)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

function renderSlider(label: string, value: number, setValue: (v: number) => void, min: number, max: number, pct: number, valCls: string, labelCls: string, sliderTrack: string) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className={labelCls}>{label}</label>
        <span className={valCls}>{value.toFixed(6)}°</span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className={`absolute inset-x-0 h-1.5 rounded-full ${sliderTrack}`} />
        <div className="absolute h-1.5 rounded-full bg-gradient-to-r from-teal-500 to-teal-400"
          style={{ left: `${Math.min(pct, 50)}%`, width: `${Math.abs(pct - 50)}%` }} />
        <input type="range" min={min} max={max} step={0.000001} value={value}
          onChange={(e) => setValue(+e.target.value)}
          className="absolute inset-x-0 w-full h-5 opacity-0 cursor-pointer z-10" />
        <div className="absolute w-3.5 h-3.5 rounded-full bg-teal-500 border-2 border-white shadow-md pointer-events-none"
          style={{ left: `calc(${pct}% - 7px)` }} />
      </div>
      <div className="flex justify-between text-[9px] text-gray-500 font-mono">
        <span>{min}°</span><span>{max}°</span>
      </div>
    </div>
  );
}

export default FacilityDetail;
