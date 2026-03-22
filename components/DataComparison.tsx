import React, { useState, useCallback, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChevronDown, ChevronUp, MapPin, Plus, Satellite } from 'lucide-react';
import GroundDataForm from './data-comparison/GroundDataForm';
import ComparisonChart from './data-comparison/ComparisonChart';
import ComparisonModeToggle from './data-comparison/ComparisonModeToggle';
import { useFacilities, useComparisonData, useSubmitGroundData } from '../src/hooks/useEmissions';
import { useDashboardStore } from '../src/stores/dashboard.store';
import type { Facility } from '../src/api/emissions.api';

interface DataComparisonProps {
  darkMode?: boolean;
}

const DataComparison: React.FC<DataComparisonProps> = ({ darkMode }) => {
  const dm = !!darkMode;
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [comparisonMode, setComparisonMode] = useState<'nearest' | 'area'>('nearest');
  const [maxDistance, setMaxDistance] = useState(300);
  const [excludedSources, setExcludedSources] = useState<Set<string>>(new Set());
  const [excludedGround, setExcludedGround] = useState<Set<number>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const { data: facilities = [] } = useFacilities();
  const { data: comparison, isLoading: isLoadingComparison } = useComparisonData(
    selectedFacilityId, undefined, undefined, comparisonMode, maxDistance,
  );
  const submitMutation = useSubmitGroundData();
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const setActiveView = useDashboardStore(s => s.setActiveView);

  const allNearbySources = useMemo(() => comparison?.allNearbySources ?? [], [comparison]);
  const allGroundData = useMemo(() => comparison?.groundData ?? [], [comparison]);

  const activeSatSources = useMemo(
    () => (comparison?.satelliteData ?? []).filter((s: any) => !excludedSources.has(s.source_name)),
    [comparison, excludedSources],
  );

  const activeGroundData = useMemo(
    () => allGroundData.filter((_: any, i: number) => !excludedGround.has(i)),
    [allGroundData, excludedGround],
  );

  const groundReadings = activeGroundData.map((gd: any) => ({
    month: new Date(gd.measurementDate).toLocaleString('en-US', { month: 'short' }),
    value: gd.methaneReading,
  }));

  const satelliteReadings = activeSatSources.map((src: any) => {
    const dateStr = src.last_detected || src.first_detected || '';
    let month = 'N/A';
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) month = d.toLocaleString('en-US', { month: 'short' });
    }
    return { month, value: src.emission_rate ?? 0, distanceKm: src.distanceKm, name: src.source_name };
  });

  const selectedFacility = (facilities as Facility[]).find(f => f.id === selectedFacilityId);

  const toggleSource = useCallback((name: string) => {
    setExcludedSources(prev => { const n = new Set(prev); if (n.has(name)) n.delete(name); else n.add(name); return n; });
  }, []);

  const toggleGroundItem = useCallback((idx: number) => {
    setExcludedGround(prev => { const n = new Set(prev); if (n.has(idx)) n.delete(idx); else n.add(idx); return n; });
  }, []);

  const handleFacilityChange = useCallback((id: string) => {
    setSelectedFacilityId(id);
    setExcludedSources(new Set());
    setExcludedGround(new Set());
    setShowAddForm(false);
  }, []);

  const handleSubmit = (data: any) => {
    setSubmitSuccess(false);
    submitMutation.mutate(data, {
      onSuccess: () => {
        setSelectedFacilityId(data.facilityId);
        setSubmitSuccess(true);
        setShowAddForm(false);
        setTimeout(() => setSubmitSuccess(false), 3000);
      },
    });
  };

  const handleExport = () => {
    if (!selectedFacilityId) return;
    const doc = new jsPDF();
    const meta = comparison?.comparisonMeta;
    doc.setFontSize(22); doc.text('NOGIET Data Comparison Report', 14, 20);
    doc.setFontSize(12); doc.setTextColor(100);
    doc.text(`Facility: ${selectedFacility?.name ?? 'N/A'}`, 14, 30);
    doc.text(`Mode: ${comparisonMode === 'nearest' ? 'Closest' : 'Area'} | ${maxDistance} km | ${meta?.matchCount ?? 0} source(s)`, 14, 37);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 44);
    let y = 56;
    if (groundReadings.length > 0) {
      doc.text('Ground Measurements:', 14, y);
      autoTable(doc, { startY: y + 5, head: [['Month', 'Reading (kg/hr)']], body: groundReadings.map((g: { month: string; value: number }) => [g.month, `${g.value}`]), theme: 'striped', headStyles: { fillColor: [13, 148, 136] } });
      y = (doc as any).lastAutoTable?.finalY ?? y + 30;
    }
    if (satelliteReadings.length > 0) {
      y += 12; doc.text('Satellite (CarbonMapper):', 14, y);
      autoTable(doc, { startY: y + 5, head: [['Source', 'Rate (kg/hr)', 'Distance']], body: satelliteReadings.map((s: { name: string; value: number; distanceKm?: number }) => [s.name, `${s.value}`, `${s.distanceKm ?? '?'} km`]), theme: 'striped', headStyles: { fillColor: [77, 208, 225] } });
    }
    doc.save(`NOGIET_Comparison_${selectedFacility?.name ?? 'Report'}.pdf`);
  };

  const inputCls = `w-full px-4 py-3 rounded-2xl border text-sm font-bold transition-all focus:ring-1 focus:ring-[#009688] outline-none ${dm ? 'bg-[#0b0e14] border-[#1e2430] text-white' : 'bg-[#f9faf9] border-gray-100 text-gray-900'}`;
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  return (
    <div className={`flex-1 overflow-y-auto p-8 transition-colors duration-300 ${dm ? 'bg-[#0b0e14]' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${dm ? 'text-white' : 'text-gray-900'}`}>Data Comparison</h1>
          <p className={`text-xs mt-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Ground measurements vs CarbonMapper satellite data</p>
        </div>
        <button onClick={handleExport} disabled={!selectedFacilityId}
          className="px-5 py-2.5 bg-[#009688] text-white rounded-2xl font-bold text-xs hover:bg-[#00796b] flex items-center gap-2 shadow-lg shadow-[#009688]/20 transition-all disabled:opacity-40">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          Export
        </button>
      </div>

      {submitSuccess && (
        <div className={`mb-4 px-5 py-2.5 rounded-2xl text-xs font-bold ${dm ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
          Ground data submitted! Chart updating.
        </div>
      )}

      {/* Facility selector row */}
      <div className={`rounded-2xl border px-5 py-4 mb-4 ${dm ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Facility</label>
            <select value={selectedFacilityId} onChange={e => handleFacilityChange(e.target.value)} className={selectCls}>
              <option value="">Select facility to compare</option>
              {(facilities as Facility[]).map(f => <option key={f.id} value={f.id}>{f.name} — {f.sector}</option>)}
            </select>
          </div>
          {selectedFacility && (
            <div className={`text-[10px] font-bold ${dm ? 'text-gray-500' : 'text-gray-400'} pt-4`}>
              {selectedFacility.latitude.toFixed(4)}°, {selectedFacility.longitude.toFixed(4)}°
            </div>
          )}
        </div>
      </div>

      {/* Controls row: mode toggle + distance slider inline */}
      {selectedFacilityId && (
        <div className={`rounded-2xl border px-5 py-3 mb-4 flex items-center gap-6 flex-wrap ${dm ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
          <ComparisonModeToggle darkMode={dm} mode={comparisonMode} onChange={setComparisonMode} meta={comparison?.comparisonMeta} />
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Radius</span>
            <input type="range" min={10} max={500} step={5} value={maxDistance} onChange={e => setMaxDistance(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-teal-500" style={{ background: dm ? '#1e2430' : '#e5e7eb' }} />
            <span className={`text-xs font-black min-w-[48px] text-right ${dm ? 'text-teal-400' : 'text-teal-600'}`}>{maxDistance}km</span>
          </div>
        </div>
      )}

      {/* Main two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Data sources panel */}
        {selectedFacilityId && (
          <div className="w-full lg:w-[380px] space-y-4">
            <SourcePanel
              darkMode={dm}
              title={`Satellite Sources Near ${selectedFacility?.name ?? ''}`}
              badge={`${allNearbySources.length} found`}
              badgeColor="cyan"
              icon={<Satellite size={14} />}
              sources={allNearbySources}
              excluded={excludedSources}
              onToggle={toggleSource}
              onViewOnMap={() => setActiveView('LIVE_MAP')}
              isLoading={isLoadingComparison}
            />

            {!isLoadingComparison && allGroundData.length > 0 && (
              <GroundPanel
                darkMode={dm}
                data={allGroundData}
                excluded={excludedGround}
                onToggle={toggleGroundItem}
              />
            )}

            <div className={`rounded-2xl border overflow-hidden transition-colors ${dm ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
              <button onClick={() => setShowAddForm(!showAddForm)}
                className={`w-full flex items-center justify-between px-5 py-3.5 transition-colors ${dm ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <Plus size={14} className="text-teal-500" />
                  <span className={`text-xs font-bold ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Add Ground Measurement</span>
                </div>
                {showAddForm ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
              </button>
              {showAddForm && (
                <div className="px-5 pb-5">
                  <GroundDataForm
                    darkMode={dm}
                    facilities={facilities as Facility[]}
                    selectedFacilityId={selectedFacilityId}
                    onFacilityChange={handleFacilityChange}
                    onSubmit={handleSubmit}
                    isSubmitting={submitMutation.isPending}
                    compact
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right: Chart */}
        <ComparisonChart
          darkMode={dm}
          hasData={!!selectedFacilityId}
          isLoading={isLoadingComparison && !!selectedFacilityId}
          groundData={groundReadings}
          satelliteData={satelliteReadings}
        />
      </div>
    </div>
  );
};

/* ─── Satellite source panel ─── */
const SourcePanel: React.FC<{
  darkMode: boolean; title: string; badge: string; badgeColor: string;
  icon: React.ReactNode; sources: any[]; excluded: Set<string>;
  onToggle: (n: string) => void; onViewOnMap: () => void; isLoading?: boolean;
}> = ({ darkMode, title, badge, sources, icon, excluded, onToggle, onViewOnMap, isLoading }) => (
  <div className={`rounded-2xl border transition-colors ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-2">
        <span className="text-cyan-500">{icon}</span>
        <h4 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h4>
      </div>
      {isLoading
        ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700'}`}>loading…</span>
        : <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700'}`}>{badge}</span>
      }
    </div>
    <div className="px-3 pb-3 space-y-1 max-h-52 overflow-y-auto">
      {isLoading ? (
        <div className="space-y-2 py-2">
          {[0, 1, 2].map(i => (
            <div key={i} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl animate-pulse ${darkMode ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
              <div className={`w-4 h-4 rounded ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
              <div className="flex-1 space-y-1.5">
                <div className={`h-2.5 rounded-full w-3/4 ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                <div className={`h-2 rounded-full w-1/2 ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`} />
              </div>
            </div>
          ))}
          <p className={`text-[10px] text-center pt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Fetching CarbonMapper data…</p>
        </div>
      ) : (
        <>
          {sources.map((src: any) => {
            const active = !excluded.has(src.source_name);
            return (
              <div key={src.source_name}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                  active ? darkMode ? 'bg-teal-500/5' : 'bg-teal-50/60' : 'opacity-40'
                }`}>
                <button onClick={() => onToggle(src.source_name)}
                  className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${
                    active ? 'bg-[#009688] border-[#009688]' : darkMode ? 'border-[#2d364a]' : 'border-gray-300'
                  }`}>
                  {active && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-bold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{src.source_name}</p>
                  <p className={`text-[9px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {src.distanceKm}km &bull; {(src.emission_rate ?? 0).toFixed(1)} kg/hr &bull; {src.lat?.toFixed(4)}°, {src.lon?.toFixed(4)}°
                  </p>
                </div>
                <button onClick={onViewOnMap} title="View on Live Map"
                  className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-600 hover:text-cyan-400' : 'hover:bg-gray-100 text-gray-400 hover:text-teal-600'}`}>
                  <MapPin size={12} />
                </button>
              </div>
            );
          })}
          {sources.length === 0 && (
            <p className={`text-[10px] text-center py-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>No satellite sources in this radius.</p>
          )}
        </>
      )}
    </div>
  </div>
);

/* ─── Ground measurement panel (toggleable items) ─── */
const GroundPanel: React.FC<{
  darkMode: boolean; data: any[]; excluded: Set<number>; onToggle: (i: number) => void;
}> = ({ darkMode, data, excluded, onToggle }) => (
  <div className={`rounded-2xl border transition-colors ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-2">
        <span className="text-teal-500"><MapPin size={14} /></span>
        <h4 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ground Measurements</h4>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-700'}`}>
        {data.length - excluded.size} / {data.length} active
      </span>
    </div>
    <div className="px-3 pb-3 space-y-1 max-h-40 overflow-y-auto">
      {data.map((gd: any, i: number) => {
        const active = !excluded.has(i);
        const dateStr = gd.measurementDate ? new Date(gd.measurementDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
        return (
          <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${active ? darkMode ? 'bg-teal-500/5' : 'bg-teal-50/60' : 'opacity-40'}`}>
            <button onClick={() => onToggle(i)}
              className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${
                active ? 'bg-[#009688] border-[#009688]' : darkMode ? 'border-[#2d364a]' : 'border-gray-300'
              }`}>
              {active && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-[11px] font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{(gd.methaneReading ?? 0).toFixed(1)} kg/hr</p>
              <p className={`text-[9px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{dateStr} &bull; {gd.methodology ?? 'N/A'}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default DataComparison;
