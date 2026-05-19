import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, ChevronRight } from 'lucide-react';
import type { DashboardView } from '../types';

const SCREEN_GUIDES: Record<string, { title: string; description: string; tips: string[] }> = {
  DASHBOARD_HOME: {
    title: 'Dashboard Overview',
    description: 'Your central command center for methane emission monitoring across all Nigerian oil and gas facilities.',
    tips: [
      'KPI cards show real-time facility counts, active satellite sources, total emission rates, and weekly alerts.',
      'The trend chart displays emission patterns over time. Use the unit selector in Settings to change units.',
      'Top emitters table highlights facilities with the highest aggregate readings.',
      'Recent alerts show the 5 latest emission threshold breaches.',
    ],
  },
  LIVE_MAP: {
    title: 'Interactive Live Map',
    description: 'Explore methane emission sources across Nigeria with satellite and ground-truth data on an interactive Mapbox map.',
    tips: [
      'Click any orange dot to view satellite source details (emission rate, plume count, instrument).',
      'Click green facility markers to see ground-truth measurement history.',
      'The square emissions grid colors each cell by methane intensity — click any cell to drill in.',
      'Use the source/statistic dropdowns in the legend to switch between IMEO, Carbon Mapper, or "All".',
      'Cells with thicker dark borders indicate alerts that exceed the configured threshold.',
      'Open Filters to narrow by state, LGA, oil block, operator, emission range, or satellite provider.',
    ],
  },
  METHANE_TRENDS: {
    title: 'Methane Trends',
    description: 'Long-term per-source comparison of Carbon Mapper, IMEO and TROPOMI feeds, plus a year-by-year statistics table.',
    tips: [
      'Long-term Trends plots monthly mean kg/hr per provider with a 12-month rolling average.',
      'Toggle a provider in the legend to mute/show its line. Use the date pickers to zoom the time window.',
      'Annual Statistics shows yearly averages and year-over-year % change per Nigerian state.',
      'Click "Details" on any state row to drill into that state\'s trend chart.',
      'Use Download CSV to export the annual table for further analysis.',
    ],
  },
  DATA_COMPARISON: {
    title: 'Data Comparison',
    description: 'Compare satellite-derived emission readings with ground-truth measurements side by side.',
    tips: [
      'Select a facility to see its satellite vs ground data plotted together.',
      'Toggle between nearest-match and time-window comparison modes.',
      'Export comparison charts as PDF or CSV for regulatory reports.',
    ],
  },
  DATA_TABS: {
    title: 'Data Explorer',
    description: 'Browse and search emission data organized into structured tabs for deep analysis.',
    tips: [
      'Satellite Sources tab shows all integrated providers (Carbon Mapper, IMEO, TROPOMI).',
      'Individual Sources lists each emission source with detailed attributes.',
      'Emission Rates tab ranks sources by their kg/hr output.',
      'Cumulative Totals aggregates total emissions per facility over time.',
      'Aggregated Averages provides regional and operator-level emission averages.',
    ],
  },
  MANAGE_DATA: {
    title: 'Manage Data',
    description: 'Add, edit, or remove facilities and submit ground-truth measurement data.',
    tips: [
      'Add new facilities by entering name, coordinates, and metadata.',
      'Submit ground measurements with date, methodology, and reading values.',
      'Each facility can have its own alert threshold configured.',
    ],
  },
  ALERTS: {
    title: 'Alerts Dashboard',
    description: 'Monitor and manage emission alerts triggered when thresholds are exceeded.',
    tips: [
      'Alerts are generated automatically when satellite or ground readings exceed facility-specific thresholds.',
      'Email and SMS notifications are sent for critical alerts.',
      'Filter alerts by severity, date range, or facility.',
      'Mark alerts as read to keep your dashboard clean.',
    ],
  },
  FIELD_DATA: {
    title: 'Field Data Collection',
    description: 'Mobile-friendly form for facility owners to submit ground-truth methane measurements directly from the field.',
    tips: [
      'Select a facility, then enter your GPS coordinates, methane reading, and conditions.',
      'Attach photos of equipment or site conditions.',
      'Submissions go through an approval workflow before being added to the main dataset.',
      'Works offline — submissions are queued and synced when connectivity returns.',
    ],
  },
  USER_MANAGEMENT: {
    title: 'User Management',
    description: 'Manage user accounts, roles, and access permissions for the NOGIET platform.',
    tips: [
      'Roles include Super Admin, Admin, Member, and Facility Owner.',
      'Facility Owners have restricted access to field data submission only.',
      'Admins can invite new users and assign roles.',
    ],
  },
  SETTINGS: {
    title: 'Settings',
    description: 'Configure your personal preferences and platform-wide settings.',
    tips: [
      'Choose your preferred emission unit (kg/hr, kg/day, tonnes/year, CO₂e/hr).',
      'Toggle dark/light mode for comfortable viewing.',
      'Configure alert thresholds and email notification preferences.',
      'Change map style between standard, satellite, light, and dark views.',
    ],
  },
  DOCS: {
    title: 'Documentation',
    description: 'A page-by-page narrative of the NOGIET portal — what each screen does, the data behind it, and how the satellite integrations work.',
    tips: [
      'Start with the Overview to get the elevator pitch — problem, users, and what success looks like.',
      'Walk through the Walkthrough section to see every screen explained the way you would demo it.',
      'Search the entire docs from the sidebar — matches title, summary, and the raw markdown body.',
      'The right-hand "On this page" panel jumps to any section; headings have copyable # links.',
      'The Reference group has the Carbon Mapper / IMEO / TROPOMI integration deep-dive and the system architecture.',
    ],
  },
};

interface ScreenGuideProps {
  darkMode: boolean;
  screenKey: DashboardView | string;
}

const ScreenGuide: React.FC<ScreenGuideProps> = ({ darkMode, screenKey }) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const guide = SCREEN_GUIDES[screenKey];

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!guide) return null;

  const dm = darkMode;

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className={`fixed bottom-6 right-6 z-[60] w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 ${
          open
            ? 'bg-teal-600 text-white shadow-teal-600/30'
            : dm
              ? 'bg-[#1a1f2b] text-gray-400 border border-[#2d364a] hover:text-teal-400 hover:border-teal-500/30'
              : 'bg-white text-gray-500 border border-gray-200 hover:text-teal-600 hover:border-teal-300'
        }`}
        title="Screen guide"
      >
        {open ? <X size={18} /> : <HelpCircle size={20} />}
      </button>

      {open && (
        <div
          ref={panelRef}
          className={`fixed bottom-20 right-6 z-[60] w-80 max-h-[70vh] rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 ${
            dm
              ? 'bg-[#12161f] border-[#1e2430] text-white'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          <div className={`px-5 py-4 border-b ${dm ? 'border-[#1e2430] bg-teal-600/10' : 'border-gray-100 bg-teal-50'}`}>
            <div className="flex items-center gap-2">
              <HelpCircle size={18} className="text-teal-500 flex-shrink-0" />
              <h3 className="font-bold text-sm">{guide.title}</h3>
            </div>
            <p className={`mt-1.5 text-xs leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
              {guide.description}
            </p>
          </div>

          <div className="px-5 py-4 overflow-y-auto max-h-[50vh] space-y-2.5">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
              Quick tips
            </p>
            {guide.tips.map((tip, i) => (
              <div key={i} className={`flex items-start gap-2.5 text-xs leading-relaxed ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                <ChevronRight size={12} className="text-teal-500 flex-shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ScreenGuide;
