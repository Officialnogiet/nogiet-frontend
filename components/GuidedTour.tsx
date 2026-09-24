import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import type { DashboardView } from '../types';

type TourStep = { view: DashboardView; target?: string; title: string; body: string };

const overviewSteps: TourStep[] = [
  { view: 'DASHBOARD_HOME', target: 'dashboard-header', title: 'Your dashboard', body: 'Start here for a national overview. Open the live map when a number needs a closer look.' },
  { view: 'DASHBOARD_HOME', target: 'dashboard-kpis', title: 'Key figures', body: 'These cards show registered facilities, satellite-detected sources, their combined emission rate, and alerts from the past week. Values depend on the data currently available.' },
  { view: 'DASHBOARD_HOME', target: 'dashboard-trend', title: 'Seven-day emission trend', body: 'Compare daily satellite observations by provider. Your preferred emission unit applies here and to the figures above.' },
  { view: 'DASHBOARD_HOME', target: 'dashboard-emitters', title: 'Top emitters', body: 'This table ranks facilities by the total of their recorded ground measurements. An empty table means facility readings are not available yet.' },
  { view: 'DASHBOARD_HOME', target: 'dashboard-alerts', title: 'Recent alerts', body: 'See the five newest threshold alerts. Open Alerts to review and manage the full list.' },
  { view: 'DASHBOARD_HOME', target: 'dashboard-actions', title: 'Quick actions', body: 'Jump straight to the live map, alerts, or data management from here.' },
  { view: 'LIVE_MAP', title: 'Explore the live map', body: 'Inspect satellite detections, facilities and oil blocks. Use filters and layers to narrow what you see.' },
  { view: 'LIVE_MAP', title: 'Open an oil block', body: 'After the tour, click an oil block on the map. Its detail panel shows the operator, location, nearby facilities and detected methane sources. Choose “View Methane Trends” at the bottom of that panel to open trends for that block.' },
  { view: 'METHANE_TRENDS', target: 'trends-header', title: 'Methane trends for a block', body: 'From an oil-block detail panel, this screen opens with that block selected. The heading shows the block name, and the chart includes satellite observations inside its boundary. Clear the block context to return to the Nigeria-wide view.' },
  { view: 'METHANE_TRENDS', title: 'Compare changes over time', body: 'Compare providers and areas, then open Annual Statistics for a table that you can export.' },
  { view: 'DATA_COMPARISON', title: 'Compare measurements', body: 'Use Data Comparison to see how field measurements and satellite detections relate at each facility.' },
  { view: 'DATA_TABS', title: 'Explore the data', body: 'Search and compare the underlying sources, emission rates, and aggregates in the Data Explorer.' },
  { view: 'MANAGE_DATA', title: 'Manage facilities and readings', body: 'Add or update facilities, set alert thresholds and submit ground measurements here.' },
  { view: 'ALERTS', title: 'Follow up on alerts', body: 'Review threshold exceedances, filter the list, and track which alerts need attention.' },
  { view: 'FIELD_DATA', target: 'field-data-form', title: 'Submit field data', body: 'The form has four steps: choose a facility, enter the location, record the methane measurement, then review and submit. Add a photo when it helps explain the reading.' },
  { view: 'FIELD_DATA', target: 'field-data-submissions', title: 'Review field submissions', body: 'Past submissions appear alongside the form. Users with review access can approve or reject a submitted reading.' },
  { view: 'METHANE_CONVERTER', title: 'Convert a reading', body: 'Convert a methane measurement into another reporting unit before using it in a report.' },
  { view: 'USER_MANAGEMENT', title: 'Manage people and roles', body: 'Review platform users and assign access according to their role.' },
  { view: 'DOCS', title: 'Find more help', body: 'Documentation explains each screen and the data behind it. The question-mark button also gives quick tips for the screen you are on.' },
  { view: 'SETTINGS', target: 'settings-unit', title: 'Choose your units', body: 'Change the unit used by the dashboard, charts, and tables. This selection is saved in this browser.' },
  { view: 'SETTINGS', title: 'Make it yours', body: 'Choose your appearance and map preferences here. Use “Start guided tour” in Settings any time you want to see this walkthrough again.' },
];

const facilityOwnerSteps: TourStep[] = [
  { view: 'FIELD_DATA', target: 'field-data-form', title: 'Submit field data', body: 'Choose your facility, enter a location, record the methane measurement, then review and submit. You can also attach photos.' },
  { view: 'FIELD_DATA', target: 'field-data-submissions', title: 'Track your submissions', body: 'Check the status of your submitted readings here.' },
  { view: 'METHANE_CONVERTER', title: 'Convert readings', body: 'Convert a methane reading into other reporting units and copy the result.' },
  { view: 'DOCS', title: 'Find more help', body: 'Documentation explains each screen. Use the question-mark button for quick tips about the current page.' },
  { view: 'SETTINGS', title: 'Replay this tour', body: 'You can restart the guided tour from Settings whenever you need a refresher.' },
];

interface GuidedTourProps {
  darkMode: boolean;
  isFacilityOwner: boolean;
  onViewChange: (view: DashboardView) => void;
  onClose: () => void;
}

const padding = 8;
const blurStyle: React.CSSProperties = { backgroundColor: 'rgba(3, 7, 10, 0.66)', backdropFilter: 'blur(3px)' };

export default function GuidedTour({ darkMode, isFacilityOwner, onViewChange, onClose }: GuidedTourProps) {
  const steps = useMemo(() => isFacilityOwner ? facilityOwnerSteps : overviewSteps, [isFacilityOwner]);
  const [index, setIndex] = useState(0);
  const [highlight, setHighlight] = useState<DOMRect | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const step = steps[index];

  useEffect(() => {
    onViewChange(step.view);
    setHighlight(null);
    dialogRef.current?.focus();
  }, [step, onViewChange]);

  useEffect(() => {
    let frame = 0;
    let selected: HTMLElement | null = null;
    const targetSelector = step.target ? `[data-tour="${step.target}"]` : `[data-tour-screen="${step.view}"]`;
    const measure = () => {
      const target = document.querySelector<HTMLElement>(targetSelector)
        ?? document.querySelector<HTMLElement>(`[data-tour-screen="${step.view}"]`);
      if (!target) { setHighlight(null); return; }
      if (target !== selected) {
        selected = target;
        target.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
      const rect = target.getBoundingClientRect();
      const left = Math.max(padding, rect.left - padding);
      const top = Math.max(padding, rect.top - padding);
      const right = Math.min(window.innerWidth - padding, rect.right + padding);
      const bottom = Math.min(window.innerHeight - padding, rect.bottom + padding);
      setHighlight(right > left && bottom > top ? new DOMRect(left, top, right - left, bottom - top) : null);
    };
    const scheduleMeasure = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new MutationObserver(scheduleMeasure);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('scroll', scheduleMeasure, true);
    scheduleMeasure();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('scroll', scheduleMeasure, true);
    };
  }, [step]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      else if (event.key === 'ArrowRight' && index < steps.length - 1) { event.preventDefault(); setIndex(index + 1); }
      else if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); setIndex(index - 1); }
      else if (event.key === 'Tab') {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]');
        if (!controls?.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [index, steps.length, onClose]);

  const w = window.innerWidth, h = window.innerHeight;
  const x = highlight?.x ?? 0, y = highlight?.y ?? 0;
  const right = highlight ? x + highlight.width : 0;
  const bottom = highlight ? y + highlight.height : 0;
  const regions: React.CSSProperties[] = highlight ? [
    { left: 0, top: 0, width: w, height: y },
    { left: 0, top: y, width: x, height: highlight.height },
    { left: right, top: y, width: w - right, height: highlight.height },
    { left: 0, top: bottom, width: w, height: h - bottom },
  ] : [{ inset: 0 }];
  const dialogAtTop = highlight ? y + highlight.height / 2 > h / 2 : false;

  return createPortal(
    <div className="fixed inset-0 z-[120]" aria-label="Guided tour overlay">
      {regions.map((region, i) => <div key={i} className="fixed" style={{ ...blurStyle, ...region }} aria-hidden="true" />)}
      {highlight && <div aria-hidden="true" className="fixed" style={{ left: x, top: y, width: highlight.width, height: highlight.height }} />}
      {highlight && <div aria-hidden="true" className="pointer-events-none fixed rounded-xl border-2 border-teal-300 shadow-[0_0_0_3px_rgba(20,184,166,0.25)]" style={{ left: x, top: y, width: highlight.width, height: highlight.height }} />}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-tour-title"
        aria-describedby="guided-tour-description"
        tabIndex={-1}
        className={`fixed left-4 right-4 mx-auto max-w-sm rounded-2xl border p-5 shadow-2xl sm:left-auto sm:right-6 sm:mx-0 sm:w-96 ${dialogAtTop ? 'top-4' : 'bottom-[calc(5rem+env(safe-area-inset-bottom))] sm:bottom-6'} ${darkMode ? 'border-[#2d364a] bg-[#12161f] text-white' : 'border-gray-200 bg-white text-gray-900'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-500">Guided tour · {index + 1} of {steps.length}</span>
          <button type="button" onClick={onClose} aria-label="Close guided tour" className={`rounded-full p-1 ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}><X size={18} /></button>
        </div>
        <h2 id="guided-tour-title" className="mt-3 text-xl font-bold">{step.title}</h2>
        <p id="guided-tour-description" className={`mt-2 text-sm leading-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{step.body}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={onClose} className={`text-sm font-medium ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Skip tour</button>
          <div className="flex items-center gap-2">
            {index > 0 && <button type="button" onClick={() => setIndex(index - 1)} className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}><ArrowLeft size={15} /> Back</button>}
            <button type="button" onClick={() => index === steps.length - 1 ? onClose() : setIndex(index + 1)} className="nogiet-button nogiet-button-primary inline-flex px-4 py-2 text-sm">{index === steps.length - 1 ? 'Finish' : 'Next'}{index < steps.length - 1 && <ArrowRight size={15} />}</button>
          </div>
        </div>
      </div>
    </div>, document.body,
  );
}
