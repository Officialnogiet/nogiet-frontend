import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trash2, Plus, MapPin, Calendar, FlaskConical, Pencil, Save, X } from 'lucide-react';
import type { Facility } from '../../src/api/emissions.api';
import { useGroundData, useDeleteFacility, useSubmitGroundData, useUpdateFacility } from '../../src/hooks/useEmissions';

interface Props {
  darkMode: boolean;
  facility: Facility;
  onBack: () => void;
}

const RANGE_KM = 2;
const KM_TO_DEG_LAT = 1 / 111.32;
const kmToLonDeg = (lat: number) => 1 / (111.32 * Math.cos((lat * Math.PI) / 180));
const SUB_SECTORS = ['Upstream', 'Midstream', 'Downstream'] as const;
const GEO_LOCATIONS = ['Onshore', 'Offshore'] as const;

const FacilityDetail: React.FC<Props> = ({ darkMode, facility, onBack }) => {
  const { data: groundData = [], isLoading } = useGroundData(facility.id);
  const deleteMutation = useDeleteFacility();
  const submitMutation = useSubmitGroundData();
  const updateMutation = useUpdateFacility();

  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [date, setDate] = useState('');
  const [reading, setReading] = useState('');
  const [methodology, setMethodology] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(() => facilityToForm(facility));

  useEffect(() => {
    setEditForm(facilityToForm(facility));
    setIsEditing(false);
    setEditError(null);
  }, [facility.id]);

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

  const updateEditField = (key: keyof FacilityFormState, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFacilityUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    const latValue = Number(editForm.latitude);
    const lonValue = Number(editForm.longitude);
    const thresholdValue = editForm.alertThreshold.trim() ? Number(editForm.alertThreshold) : null;

    if (!editForm.name.trim()) { setEditError('Name is required'); return; }
    if (!Number.isFinite(latValue) || latValue < -90 || latValue > 90) { setEditError('Latitude must be between -90 and 90'); return; }
    if (!Number.isFinite(lonValue) || lonValue < -180 || lonValue > 180) { setEditError('Longitude must be between -180 and 180'); return; }
    if (!editForm.subSector) { setEditError('Facilities Classification or Sub-Sector is required'); return; }
    if (thresholdValue != null && (!Number.isFinite(thresholdValue) || thresholdValue <= 0)) {
      setEditError('Alert threshold must be a positive number');
      return;
    }

    updateMutation.mutate(
      {
        id: facility.id,
        data: {
          name: editForm.name.trim(),
          latitude: latValue,
          longitude: lonValue,
          sector: editForm.sector.trim() || undefined,
          region: editForm.region.trim() || undefined,
          state: editForm.state.trim() || undefined,
          lga: editForm.lga.trim() || undefined,
          subSector: editForm.subSector as typeof SUB_SECTORS[number],
          oilBlock: editForm.oilBlock.trim() || undefined,
          oilfield: editForm.oilfield.trim() || undefined,
          operator: editForm.operator.trim() || undefined,
          facilityType: editForm.facilityType.trim() || undefined,
          geographicLocation: editForm.geographicLocation ? editForm.geographicLocation as typeof GEO_LOCATIONS[number] : undefined,
          customField1: editForm.customField1.trim() || undefined,
          customField2: editForm.customField2.trim() || undefined,
          customField3: editForm.customField3.trim() || undefined,
          alertThreshold: thresholdValue,
        },
      },
      {
        onSuccess: () => setIsEditing(false),
        onError: (err: any) => setEditError(err.message ?? 'Failed to update facility'),
      },
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
            {facility.subSector && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${darkMode ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-700'}`}>{facility.subSector}</span>}
            {facility.region && <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{facility.region}</span>}
            <span className={`text-[11px] font-mono ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsEditing((v) => !v); setEditError(null); setEditForm(facilityToForm(facility)); }}
            className={`p-2 rounded-xl transition-colors ${isEditing ? 'bg-teal-600 text-white' : darkMode ? 'text-gray-400 hover:bg-[#1e2430]' : 'text-gray-500 hover:bg-gray-100'}`}
            title={isEditing ? 'Cancel editing' : 'Edit facility metadata'}
          >
            {isEditing ? <X size={18} /> : <Pencil size={18} />}
          </button>
          <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors" title="Delete facility">
            <Trash2 size={18} />
          </button>
        </div>
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

      <div className={`mb-6 rounded-2xl border p-5 ${darkMode ? 'bg-[#0b0e14]/60 border-[#1e2430]' : 'bg-gray-50 border-gray-100'}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Facility metadata</h4>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${darkMode ? 'bg-[#1e2430] text-gray-300 hover:bg-[#263042]' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleFacilityUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <EditField label="Name" value={editForm.name} onChange={(v) => updateEditField('name', v)} inputCls={inputCls} />
              <EditField label="Sector" value={editForm.sector} onChange={(v) => updateEditField('sector', v)} inputCls={inputCls} />
              <EditField label="Latitude" value={editForm.latitude} onChange={(v) => updateEditField('latitude', v)} inputCls={inputCls} type="number" />
              <EditField label="Longitude" value={editForm.longitude} onChange={(v) => updateEditField('longitude', v)} inputCls={inputCls} type="number" />
              <EditSelect label="Sub-sector" value={editForm.subSector} onChange={(v) => updateEditField('subSector', v)} selectCls={selectCls} options={SUB_SECTORS} required />
              <EditField label="Facility Type" value={editForm.facilityType} onChange={(v) => updateEditField('facilityType', v)} inputCls={inputCls} />
              <EditField label="Operator" value={editForm.operator} onChange={(v) => updateEditField('operator', v)} inputCls={inputCls} />
              <EditField label="Oil Block" value={editForm.oilBlock} onChange={(v) => updateEditField('oilBlock', v)} inputCls={inputCls} />
              <EditField label="Oilfield" value={editForm.oilfield} onChange={(v) => updateEditField('oilfield', v)} inputCls={inputCls} />
              <EditField label="Region" value={editForm.region} onChange={(v) => updateEditField('region', v)} inputCls={inputCls} />
              <EditField label="State" value={editForm.state} onChange={(v) => updateEditField('state', v)} inputCls={inputCls} />
              <EditField label="LGA" value={editForm.lga} onChange={(v) => updateEditField('lga', v)} inputCls={inputCls} />
              <EditSelect label="Location" value={editForm.geographicLocation} onChange={(v) => updateEditField('geographicLocation', v)} selectCls={selectCls} options={GEO_LOCATIONS} />
              <EditField label="Alert Threshold" value={editForm.alertThreshold} onChange={(v) => updateEditField('alertThreshold', v)} inputCls={inputCls} type="number" />
              <EditField label="Custom Field 1" value={editForm.customField1} onChange={(v) => updateEditField('customField1', v)} inputCls={inputCls} />
              <EditField label="Custom Field 2" value={editForm.customField2} onChange={(v) => updateEditField('customField2', v)} inputCls={inputCls} />
              <EditField label="Custom Field 3" value={editForm.customField3} onChange={(v) => updateEditField('customField3', v)} inputCls={inputCls} />
            </div>
            {editError && <p className="text-red-500 text-xs font-bold">{editError}</p>}
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="submit" disabled={updateMutation.isPending}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-colors disabled:opacity-50">
                <Save size={15} /> {updateMutation.isPending ? 'Saving...' : 'Save Facility'}
              </button>
              <button type="button" onClick={() => { setIsEditing(false); setEditError(null); setEditForm(facilityToForm(facility)); }}
                className={`px-5 py-3 rounded-2xl text-sm font-bold ${darkMode ? 'bg-[#1e2430] text-gray-300' : 'bg-white border border-gray-200 text-gray-600'}`}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow label="Sub-sector" value={facility.subSector} darkMode={darkMode} />
            <InfoRow label="Facility Type" value={facility.facilityType} darkMode={darkMode} />
            <InfoRow label="Operator" value={facility.operator} darkMode={darkMode} />
            <InfoRow label="Oil Block" value={facility.oilBlock} darkMode={darkMode} />
            <InfoRow label="Oilfield" value={facility.oilfield} darkMode={darkMode} />
            <InfoRow label="State" value={facility.state} darkMode={darkMode} />
            <InfoRow label="LGA" value={facility.lga} darkMode={darkMode} />
            <InfoRow label="Location" value={facility.geographicLocation} darkMode={darkMode} />
            <InfoRow label="Alert Threshold" value={facility.alertThreshold != null ? `${facility.alertThreshold} kg/hr` : undefined} darkMode={darkMode} />
            <InfoRow label="Custom Field 1" value={facility.customField1} darkMode={darkMode} />
            <InfoRow label="Custom Field 2" value={facility.customField2} darkMode={darkMode} />
            <InfoRow label="Custom Field 3" value={facility.customField3} darkMode={darkMode} />
          </div>
        )}
      </div>

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

const InfoRow: React.FC<{ label: string; value?: string | null; darkMode: boolean }> = ({ label, value, darkMode }) => (
  <div>
    <p className={`text-[10px] font-bold uppercase tracking-wide ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{label}</p>
    <p className={`mt-0.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{value || '—'}</p>
  </div>
);

type FacilityFormState = {
  name: string;
  latitude: string;
  longitude: string;
  sector: string;
  region: string;
  state: string;
  lga: string;
  subSector: string;
  oilBlock: string;
  oilfield: string;
  operator: string;
  facilityType: string;
  geographicLocation: string;
  customField1: string;
  customField2: string;
  customField3: string;
  alertThreshold: string;
};

const facilityToForm = (facility: Facility): FacilityFormState => ({
  name: facility.name ?? '',
  latitude: String(facility.latitude ?? ''),
  longitude: String(facility.longitude ?? ''),
  sector: facility.sector ?? '',
  region: facility.region ?? '',
  state: facility.state ?? '',
  lga: facility.lga ?? '',
  subSector: facility.subSector ?? '',
  oilBlock: facility.oilBlock ?? '',
  oilfield: facility.oilfield ?? '',
  operator: facility.operator ?? '',
  facilityType: facility.facilityType ?? '',
  geographicLocation: facility.geographicLocation ?? '',
  customField1: facility.customField1 ?? '',
  customField2: facility.customField2 ?? '',
  customField3: facility.customField3 ?? '',
  alertThreshold: facility.alertThreshold != null ? String(facility.alertThreshold) : '',
});

const EditField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputCls: string;
  type?: 'text' | 'number';
}> = ({ label, value, onChange, inputCls, type = 'text' }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
    <input
      type={type}
      step={type === 'number' ? 'any' : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    />
  </div>
);

const EditSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  selectCls: string;
  options: readonly string[];
  required?: boolean;
}> = ({ label, value, onChange, selectCls, options, required }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls} required={required}>
      <option value="">Select {label.toLowerCase()}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </div>
);
