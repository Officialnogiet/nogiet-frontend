import React, { useState, useCallback, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChevronDown, ChevronUp, Download, AlertTriangle, Plus, Sliders, RefreshCw } from 'lucide-react';
import GroundDataForm from './data-comparison/GroundDataForm';
import ComparisonKPIs from './data-comparison/ComparisonKPIs';
import ComparisonTimeline from './data-comparison/ComparisonTimeline';
import MatchTable from './data-comparison/MatchTable';
import {
  DEFAULT_MATCH_OPTIONS,
  matchObservations,
  normaliseGround,
  normaliseSatellite,
  summarise,
  withinWindow,
  VERDICT_META,
} from './data-comparison/comparisonAnalysis';
import { useFacilities, useComparisonData, useSubmitGroundData } from '../src/hooks/useEmissions';
import { useDashboardStore } from '../src/stores/dashboard.store';
import type { Facility } from '../src/api/emissions.api';

interface DataComparisonProps {
  darkMode?: boolean;
}

/**
 * The Data Comparison screen answers a single regulator question:
 *
 *     "Does what the satellite saw match what the operator is reporting?"
 *
 * The previous version was a raw two-list dump that left the user to draw their
 * own conclusions. This version produces a verdict per pair (Confirmed /
 * Under-reported / Over-reported / Satellite-only / Ground-only), shows the
 * full chronology in one scatter plot, and aggregates everything into KPI tiles
 * at the top so a desk officer can act in seconds.
 */

const TIME_RANGE_OPTIONS: { value: number | null; label: string }[] = [
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last 12 months' },
  { value: null, label: 'All time' },
];

const TOLERANCE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '±1 day (strict)' },
  { value: 7, label: '±7 days (default)' },
  { value: 14, label: '±14 days' },
  { value: 30, label: '±30 days (loose)' },
];

const AGREEMENT_OPTIONS: { value: number; label: string }[] = [
  { value: 0.1, label: 'Within ±10%' },
  { value: 0.25, label: 'Within ±25% (default)' },
  { value: 0.5, label: 'Within ±50%' },
];

const DataComparison: React.FC<DataComparisonProps> = ({ darkMode }) => {
  const dm = !!darkMode;

  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [windowDays, setWindowDays] = useState<number | null>(90);
  const [toleranceDays, setToleranceDays] = useState<number>(DEFAULT_MATCH_OPTIONS.toleranceDays);
  const [agreementBand, setAgreementBand] = useState<number>(DEFAULT_MATCH_OPTIONS.agreementBand);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { data: facilities = [] } = useFacilities();
  const { data: comparison, isLoading: isLoadingComparison, refetch } = useComparisonData(
    selectedFacilityId,
    undefined,
    undefined,
    'area', // pull every nearby source so we have something to actually compare
    400,
  );
  const submitMutation = useSubmitGroundData();
  const setActiveView = useDashboardStore((s) => s.setActiveView);

  const selectedFacility = (facilities as Facility[]).find((f) => f.id === selectedFacilityId);

  /* ---------- Normalised observations + matching ---------- */

  const allSatellite = useMemo(
    () => normaliseSatellite(comparison?.allNearbySources ?? []),
    [comparison?.allNearbySources],
  );
  const allGround = useMemo(
    () => normaliseGround(comparison?.groundData ?? []),
    [comparison?.groundData],
  );

  const windowedSatellite = useMemo(() => withinWindow(allSatellite, windowDays), [allSatellite, windowDays]);
  const windowedGround = useMemo(() => withinWindow(allGround, windowDays), [allGround, windowDays]);

  const pairs = useMemo(
    () => matchObservations(windowedSatellite, windowedGround, { toleranceDays, agreementBand }),
    [windowedSatellite, windowedGround, toleranceDays, agreementBand],
  );

  const summary = useMemo(
    () => summarise(windowedSatellite, windowedGround, pairs),
    [windowedSatellite, windowedGround, pairs],
  );

  /* ---------- Handlers ---------- */

  const handleFacilityChange = useCallback((id: string) => {
    setSelectedFacilityId(id);
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
    doc.setFontSize(20);
    doc.text('NOGIET Data Comparison Report', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(110);
    doc.text(`Facility: ${selectedFacility?.name ?? 'N/A'}`, 14, 30);
    doc.text(
      `Window: ${windowDays == null ? 'All time' : `Last ${windowDays} days`}  ·  Tolerance: ±${toleranceDays}d  ·  Agreement band: ±${(agreementBand * 100).toFixed(0)}%`,
      14, 37,
    );
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 44);

    autoTable(doc, {
      startY: 52,
      head: [['Verdict', 'Count']],
      body: [
        ['Confirmed', String(summary.confirmed)],
        ['Likely under-reported (sat > ground)', String(summary.underReported)],
        ['Possibly over-reported (ground > sat)', String(summary.overReported)],
        ['Satellite-only', String(summary.satelliteOnly)],
        ['Ground-only', String(summary.groundOnly)],
        ['Mean ground (kg/hr)', summary.meanGround.toFixed(1)],
        ['Mean satellite (kg/hr)', summary.meanSatellite.toFixed(1)],
        ['Mean ratio (sat / ground)', summary.meanRatio == null ? '—' : `${summary.meanRatio.toFixed(2)}×`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] },
      styles: { fontSize: 9 },
    });

    if (pairs.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY ?? 90;
      autoTable(doc, {
        startY: finalY + 8,
        head: [['Date', 'Source', 'Sat (kg/hr)', 'Ground (kg/hr)', 'Δ rate', 'Δ days', 'Verdict']],
        body: pairs.slice(0, 50).map((p) => {
          const date = (p.satellite?.date ?? p.ground?.date)?.toLocaleDateString('en-GB') ?? '—';
          return [
            date,
            p.satellite ? `${p.satellite.sourceName} (${p.satellite.provider})` : '—',
            p.satellite ? p.satellite.rate.toFixed(1) : '—',
            p.ground ? p.ground.reading.toFixed(1) : '—',
            p.deltaRate == null ? '—' : `${p.deltaRate >= 0 ? '+' : ''}${p.deltaRate.toFixed(1)}`,
            p.deltaDays == null ? '—' : `${p.deltaDays.toFixed(1)}`,
            VERDICT_META[p.verdict].label,
          ];
        }),
        theme: 'striped',
        headStyles: { fillColor: [13, 148, 136] },
        styles: { fontSize: 8 },
      });
    }

    doc.save(`NOGIET_Comparison_${selectedFacility?.name ?? 'Report'}.pdf`);
  };

  /* ---------- Styles ---------- */

  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all focus:ring-1 focus:ring-[#009688] outline-none ${
    dm ? 'bg-[#0b0e14] border-[#1e2430] text-white' : 'bg-white border-gray-200 text-gray-900'
  }`;
  const selectCls = `${inputCls} appearance-none cursor-pointer pr-8`;
  const cardChip = dm ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100';
  const subText = dm ? 'text-gray-400' : 'text-gray-500';

  const noFacility = !selectedFacilityId;
  const satelliteUnavailable =
    !!comparison && (comparison as any).comparisonMeta?.satelliteAvailable === false;

  /* ---------- Render ---------- */

  return (
    <div className={`flex-1 overflow-y-auto p-6 lg:p-8 transition-colors duration-300 ${dm ? 'bg-[#0b0e14]' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${dm ? 'text-white' : 'text-gray-900'}`}>
            Data Comparison
          </h1>
          <p className={`text-xs mt-1 ${subText}`}>
            Validates operator ground submissions against Carbon Mapper, IMEO and TROPOMI satellite detections
            and produces a per-pair verdict.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={!selectedFacilityId || isLoadingComparison}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40 ${
              dm ? 'bg-[#12161f] border border-[#1e2430] text-gray-300 hover:bg-white/5' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
            title="Re-run the comparison"
          >
            <RefreshCw size={12} className={isLoadingComparison ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={!selectedFacilityId}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold bg-[#009688] text-white hover:bg-[#00796b] shadow-lg shadow-[#009688]/20 transition-all disabled:opacity-40"
          >
            <Download size={12} />
            Export PDF
          </button>
        </div>
      </header>

      {/* Controls row */}
      <div className={`rounded-2xl border ${cardChip} p-4 mb-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ControlField label="Facility" dm={dm}>
            <select value={selectedFacilityId} onChange={(e) => handleFacilityChange(e.target.value)} className={selectCls}>
              <option value="">Select a facility…</option>
              {(facilities as Facility[]).map((f) => (
                <option key={f.id} value={f.id}>{f.name} — {f.sector}</option>
              ))}
            </select>
            {selectedFacility && (
              <p className={`mt-1 text-[10px] ${subText}`}>
                {selectedFacility.latitude.toFixed(4)}°, {selectedFacility.longitude.toFixed(4)}°
              </p>
            )}
          </ControlField>

          <ControlField label="Time window" dm={dm}>
            <select
              value={windowDays == null ? 'all' : String(windowDays)}
              onChange={(e) => setWindowDays(e.target.value === 'all' ? null : Number(e.target.value))}
              className={selectCls}
            >
              {TIME_RANGE_OPTIONS.map((o) => (
                <option key={String(o.value)} value={o.value == null ? 'all' : String(o.value)}>
                  {o.label}
                </option>
              ))}
            </select>
          </ControlField>

          <ControlField label="Time tolerance" dm={dm} hint="How close in time a ground reading must be to a satellite detection to count as a match.">
            <select value={toleranceDays} onChange={(e) => setToleranceDays(Number(e.target.value))} className={selectCls}>
              {TOLERANCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </ControlField>

          <ControlField label="Agreement band" dm={dm} hint="Maximum relative difference between satellite and ground rates to consider 'Confirmed'.">
            <select value={agreementBand} onChange={(e) => setAgreementBand(Number(e.target.value))} className={selectCls}>
              {AGREEMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </ControlField>
        </div>

        <button
          onClick={() => setShowSettings((v) => !v)}
          className={`mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${dm ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
        >
          <Sliders size={11} />
          {showSettings ? 'Hide methodology' : 'How verdicts are computed'}
        </button>
        {showSettings && (
          <p className={`mt-2 text-[11px] leading-relaxed ${subText}`}>
            For every satellite detection, NOGIET searches for the **closest in time** ground reading
            within the chosen time tolerance. If a match exists, the rates are compared: when both rates
            agree within the agreement band the pair is "Confirmed". A satellite reading higher than the
            ground reading by more than the band is "Likely under-reported" — a possible missed leak the
            operator should investigate. The reverse case is "Possibly over-reported". Detections without
            a partner end up as Satellite-only or Ground-only respectively.
          </p>
        )}
      </div>

      {submitSuccess && (
        <div className={`mb-4 px-5 py-2.5 rounded-2xl text-xs font-bold ${dm ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
          Ground reading submitted — comparison updating.
        </div>
      )}

      {satelliteUnavailable && (
        <div className={`mb-4 flex items-start gap-2.5 px-4 py-3 rounded-2xl text-xs ${dm ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <span>
            Satellite data is temporarily unavailable. Ground readings still appear; verdicts will repopulate as soon as the satellite feeds reconnect.
          </span>
        </div>
      )}

      {/* Empty state */}
      {noFacility && (
        <EmptyChooseFacility dm={dm} />
      )}

      {/* Loading */}
      {!noFacility && isLoadingComparison && (
        <LoadingPanel dm={dm} />
      )}

      {/* Result */}
      {!noFacility && !isLoadingComparison && (
        <div className="space-y-5">
          <ComparisonKPIs darkMode={dm} summary={summary} />
          <ComparisonTimeline
            darkMode={dm}
            satellite={windowedSatellite}
            ground={windowedGround}
            pairs={pairs}
          />
          <MatchTable darkMode={dm} pairs={pairs} />

          {/* Add-ground-reading affordance */}
          <div className={`rounded-2xl border overflow-hidden transition-colors ${cardChip}`}>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dm ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-2">
                <Plus size={14} className="text-teal-500" />
                <span className={`text-xs font-bold ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Add ground measurement</span>
              </div>
              {showAddForm ? <ChevronUp size={14} className={subText} /> : <ChevronDown size={14} className={subText} />}
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

          <p className={`text-[11px] ${subText}`}>
            Tip: open this facility on the
            <button
              type="button"
              onClick={() => setActiveView('LIVE_MAP')}
              className={`ml-1 font-bold underline ${dm ? 'text-teal-400' : 'text-teal-600'}`}
            >
              live map
            </button>
            {' '}to see the same satellite plumes geo-located, or jump to
            <button
              type="button"
              onClick={() => setActiveView('METHANE_TRENDS')}
              className={`ml-1 font-bold underline ${dm ? 'text-teal-400' : 'text-teal-600'}`}
            >
              long-term trends
            </button>
            {' '}for a full multi-year view.
          </p>
        </div>
      )}
    </div>
  );
};

/* ───────────────────────────── Building blocks ───────────────────────────── */

const ControlField: React.FC<{ label: string; dm: boolean; hint?: string; children: React.ReactNode }> = ({
  label, dm, hint, children,
}) => (
  <div>
    <label
      className={`text-[10px] font-bold uppercase tracking-widest mb-1 block ${dm ? 'text-gray-500' : 'text-gray-400'}`}
      title={hint}
    >
      {label}
    </label>
    {children}
  </div>
);

const EmptyChooseFacility: React.FC<{ dm: boolean }> = ({ dm }) => (
  <div className={`rounded-2xl border p-10 text-center ${dm ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
    <p className={`text-sm font-bold mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>Choose a facility to begin</p>
    <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
      Select a facility above to compare its ground readings against Carbon Mapper, IMEO and TROPOMI satellite detections.
    </p>
  </div>
);

const LoadingPanel: React.FC<{ dm: boolean }> = ({ dm }) => (
  <div
    className={`rounded-2xl border p-10 flex flex-col items-center justify-center gap-4 min-h-[280px] ${dm ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}
    role="status"
    aria-live="polite"
  >
    <div className="relative w-12 h-12">
      <div className={`absolute inset-0 rounded-full border-2 border-transparent animate-spin ${dm ? 'border-t-teal-400' : 'border-t-teal-600'}`} />
      <div
        className={`absolute inset-1.5 rounded-full border-2 border-transparent animate-spin ${dm ? 'border-b-teal-600' : 'border-b-teal-400'}`}
        style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
      />
    </div>
    <p className={`text-xs font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Reconciling ground readings with satellite data…</p>
  </div>
);

export default DataComparison;
