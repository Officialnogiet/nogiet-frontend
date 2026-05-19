import React, { useEffect, useMemo, useState } from 'react';
import { LineChart as LineChartIcon, Table as TableIcon, MapPin, Loader2, Satellite } from 'lucide-react';
import { useFacilities, useSatelliteSources } from '../src/hooks/useEmissions';
import { useSatelliteStore } from '../src/stores/satellite.store';
import TrendsChart from './methane-trends/TrendsChart';
import AnnualStatisticsTable from './methane-trends/AnnualStatisticsTable';
import { buildAnnualTable, buildFeedSeries, isoMonth, type AnnualObservation } from './methane-trends/aggregations';
import { attachStateNames } from './methane-trends/stateLookup';
import type { GroupByMode, ProviderId } from './methane-trends/types';

interface MethaneTrendsProps {
  darkMode?: boolean;
}

type Tab = 'TRENDS' | 'ANNUAL';

const NIGERIA_BBOX = '3,4,15,14';

/** Approximate distance (km) between two lat/lon points using the equirectangular shortcut. */
function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const lat = ((aLat + bLat) / 2) * Math.PI / 180;
  const dLat = (bLat - aLat) * Math.PI / 180;
  const dLon = (bLon - aLon) * Math.PI / 180;
  const x = dLon * Math.cos(lat);
  return Math.sqrt(x * x + dLat * dLat) * R;
}

const MethaneTrends: React.FC<MethaneTrendsProps> = ({ darkMode = true }) => {
  const dm = !!darkMode;
  const [tab, setTab] = useState<Tab>('TRENDS');
  const [scope, setScope] = useState<string>('Nigeria');
  const [providerFilter, setProviderFilter] = useState<'all' | ProviderId>('all');
  const [groupBy, setGroupBy] = useState<GroupByMode>('state');

  // Pull a wide satellite query so we have enough history to build a trend
  const { isFetching } = useSatelliteSources({
    gasType: 'CH4', page: 1, limit: 100, bbox: NIGERIA_BBOX,
  });
  const sources = useSatelliteStore((s) => s.sources);
  const { data: facilities = [] } = useFacilities();

  // Filter by provider
  const filteredSources = useMemo(() => {
    return sources.filter((s) => providerFilter === 'all' || s.provider === providerFilter);
  }, [sources, providerFilter]);

  // Derive base observations: each source has lastDetected + emissionRate. If no date is set,
  // fall back to "now" so it still appears in the latest bucket.
  const baseObservations = useMemo(() => {
    const now = new Date().toISOString();
    return filteredSources.map((s) => ({
      provider: s.provider as ProviderId,
      // For IMEO, the underlying satellite (e.g. "EnMAP - DLR") IS the discriminator;
      // for Carbon Mapper / TROPOMI we keep `instrument` for completeness too.
      instrument: s.instrument ?? null,
      date: s.lastDetected || s.firstDetected || now,
      emissionRate: Number(s.emissionRate ?? 0),
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
    })).filter((r) =>
      Number.isFinite(r.emissionRate) && r.emissionRate > 0 &&
      Number.isFinite(r.latitude) && Number.isFinite(r.longitude),
    );
  }, [filteredSources]);

  // Time range: floor(earliest) → today
  const range = useMemo(() => {
    if (baseObservations.length === 0) {
      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear() - 4, 0, 1));
      return { start: isoMonth(start.toISOString()) ?? '2020-01', end: isoMonth(now.toISOString()) ?? '2026-12' };
    }
    let earliest = Infinity, latest = -Infinity;
    for (const o of baseObservations) {
      const t = new Date(o.date).getTime();
      if (Number.isFinite(t)) {
        if (t < earliest) earliest = t;
        if (t > latest) latest = t;
      }
    }
    if (!Number.isFinite(earliest)) {
      const now = new Date();
      earliest = Date.UTC(now.getUTCFullYear() - 4, 0, 1);
      latest = Date.now();
    }
    return {
      start: isoMonth(new Date(earliest).toISOString()) ?? '2020-01',
      end: isoMonth(new Date(latest).toISOString()) ?? '2026-12',
    };
  }, [baseObservations]);

  const [activeRange, setActiveRange] = useState(range);
  useEffect(() => { setActiveRange(range); }, [range.start, range.end]);

  // Resolve state name + nearest facility for every observation (async, cancelable).
  const [enriched, setEnriched] = useState<AnnualObservation[]>([]);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (baseObservations.length === 0) {
      setEnriched([]);
      setEnriching(false);
      return;
    }
    setEnriching(true);
    (async () => {
      const withState = await attachStateNames(baseObservations);
      if (cancelled) return;

      // Bind nearest facility (within 30 km) for facility group-by mode.
      const facList = (facilities as { id: string; name: string; latitude: number; longitude: number }[])
        .filter((f) => Number.isFinite(f.latitude) && Number.isFinite(f.longitude));

      const out: AnnualObservation[] = withState.map((row) => {
        let bestName: string | null = null;
        if (facList.length > 0) {
          let bestKm = Infinity;
          for (const f of facList) {
            const km = distanceKm(row.latitude, row.longitude, f.latitude, f.longitude);
            if (km < bestKm) { bestKm = km; bestName = f.name; }
          }
          if (bestKm > 30) bestName = null; // out of attribution radius
        }
        return {
          provider: row.provider,
          instrument: row.instrument,
          date: row.date,
          emissionRate: row.emissionRate,
          state: row.state,
          facility: bestName,
          latitude: row.latitude,
          longitude: row.longitude,
        };
      });

      if (!cancelled) {
        setEnriched(out);
        setEnriching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [baseObservations, facilities]);

  const series = useMemo(
    () => buildFeedSeries(enriched, activeRange.start, activeRange.end, 12),
    [enriched, activeRange.start, activeRange.end],
  );

  const years = useMemo(() => {
    const yrs = new Set<number>();
    for (const o of enriched) {
      const d = new Date(o.date);
      if (Number.isFinite(d.getTime())) yrs.add(d.getUTCFullYear());
    }
    return [...yrs].sort();
  }, [enriched]);

  const annualRows = useMemo(() => {
    if (years.length === 0) return [];
    const globalLabel = groupBy === 'facility' ? 'All facilities' : 'Nigeria';
    return buildAnnualTable(enriched, years, groupBy, globalLabel);
  }, [enriched, years, groupBy]);

  const handleDownloadCsv = () => {
    if (annualRows.length === 0 || years.length === 0) return;
    const headerCells = [
      groupBy === 'state' ? 'State' : groupBy === 'region' ? 'Region' : 'Facility',
      'Region',
      'Latitude',
      'Longitude',
    ];
    for (let i = 0; i < years.length; i++) {
      const y = years[i];
      headerCells.push(`${y} Avg (kg/hr)`);
      if (i > 0) headerCells.push(`${y} YoY %`);
      headerCells.push(`${y} CarbonMapper`, `${y} IMEO`, `${y} TROPOMI`);
    }
    const lines = [headerCells.join(',')];
    for (const row of annualRows) {
      const cells: string[] = [
        `"${row.key.replace(/"/g, '""')}"`,
        row.region ?? '',
        row.geo ? row.geo.latitude.toFixed(5) : '',
        row.geo ? row.geo.longitude.toFixed(5) : '',
      ];
      years.forEach((y, i) => {
        const v = row.averages[y];
        cells.push(v == null ? '' : v.toFixed(2));
        if (i > 0) {
          const c = row.changes[y];
          cells.push(c == null ? '' : c.toFixed(2));
        }
        const cm = row.byProvider.carbon_mapper[y];
        const im = row.byProvider.imeo[y];
        const tr = row.byProvider.tropomi[y];
        cells.push(cm == null ? '' : cm.toFixed(2));
        cells.push(im == null ? '' : im.toFixed(2));
        cells.push(tr == null ? '' : tr.toFixed(2));
      });
      lines.push(cells.join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nogiet-annual-statistics-${groupBy}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const headingColor = dm ? 'text-white' : 'text-gray-900';
  const subColor = dm ? 'text-gray-400' : 'text-gray-500';
  const tabActive = 'bg-[#0f766e] text-white';
  const tabIdle = dm ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100';
  const surface = dm ? 'bg-[#0b0e14]' : 'bg-gray-50';
  const chip = dm ? 'bg-[#12161f] border-[#1e2430] text-gray-200' : 'bg-white border-gray-200 text-gray-700';

  // Show preloader/fetching banner whenever we have nothing yet (network or post-process)
  const isLoading = (isFetching || enriching) && enriched.length === 0;
  const hasData = enriched.length > 0;
  const fetchingText = isFetching ? 'Fetching satellite data…' : 'Computing aggregations…';

  return (
    <div className={`flex-1 overflow-y-auto ${surface}`}>
      <header className="px-6 md:px-8 pt-12 pb-4 mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold ${headingColor}`}>Methane Trends — {scope}</h1>
            <p className={`text-sm mt-1 ${subColor}`}>Long-term satellite observations comparing Carbon Mapper, IMEO and TROPOMI feeds.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className={`text-xs px-3 py-2 rounded-xl border outline-none ${chip}`}
              aria-label="Scope"
            >
              <option value="Nigeria">Nigeria (all states)</option>
            </select>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value as any)}
              className={`text-xs px-3 py-2 rounded-xl border outline-none ${chip}`}
              aria-label="Provider"
            >
              <option value="all">All providers</option>
              <option value="carbon_mapper">Carbon Mapper</option>
              <option value="imeo">IMEO (UNEP)</option>
              <option value="tropomi">TROPOMI</option>
            </select>
            {tab === 'ANNUAL' && (
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupByMode)}
                className={`text-xs px-3 py-2 rounded-xl border outline-none ${chip}`}
                aria-label="Group annual statistics by"
              >
                <option value="state">Group by State</option>
                <option value="region">Group by Region</option>
                <option value="facility">Group by Facility</option>
              </select>
            )}
          </div>
        </div>

        <nav className="mt-6 flex items-center gap-1.5 flex-wrap">
          <TabButton active={tab === 'TRENDS'} onClick={() => setTab('TRENDS')} activeCls={tabActive} idleCls={tabIdle}>
            <LineChartIcon size={14} /> Long-term Trends
          </TabButton>
          <TabButton active={tab === 'ANNUAL'} onClick={() => setTab('ANNUAL')} activeCls={tabActive} idleCls={tabIdle}>
            <TableIcon size={14} /> Annual Statistics
          </TabButton>
          {(isFetching || enriching) && hasData && (
            <span className={`ml-2 inline-flex items-center gap-1.5 text-[11px] font-medium ${subColor}`}>
              <Loader2 size={12} className="animate-spin" /> {fetchingText}
            </span>
          )}
        </nav>
      </header>

      <main className="px-6 md:px-10 pb-12 mx-auto space-y-6">
        {isLoading && <FetchingPanel dm={dm} text={fetchingText} />}

        {!isLoading && !hasData && <EmptyState dm={dm} />}

        {!isLoading && hasData && tab === 'TRENDS' && (
          <TrendsChart
            darkMode={dm}
            series={series}
            range={activeRange}
            onRangeChange={setActiveRange}
            title={`Long-term trends for ${scope}`}
            description={[
              'This view shows monthly methane emission rates across all matching sources, with a 12-month rolling average to smooth seasonal noise.',
              'The lower chart shows the proportion of months containing observations. Coverage may dip during heavy cloud cover or instrument maintenance.',
            ]}
          />
        )}

        {!isLoading && hasData && tab === 'ANNUAL' && (
          <>
            <div className={`text-xs px-3 py-2 rounded-xl border ${chip} max-w-2xl flex items-center gap-2`}>
              <MapPin size={14} className="opacity-60" />
              <span>
                {groupBy === 'state' && 'Grouped by Nigerian state. Region (geopolitical zone) and centroid coordinates accompany each row.'}
                {groupBy === 'region' && 'Grouped by Nigeria\'s six geopolitical zones. Each zone aggregates every state in it.'}
                {groupBy === 'facility' && 'Each satellite observation is bound to its nearest registered facility within 30 km.'}
              </span>
            </div>
            <AnnualStatisticsTable
              darkMode={dm}
              rows={annualRows}
              years={years}
              groupBy={groupBy}
              onDownloadCsv={handleDownloadCsv}
              onOpenDetails={(rowKey) => {
                setScope(rowKey);
                setTab('TRENDS');
              }}
            />
          </>
        )}
      </main>
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  activeCls: string;
  idleCls: string;
  children: React.ReactNode;
}> = ({ active, onClick, activeCls, idleCls, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${active ? activeCls : idleCls}`}
  >
    {children}
  </button>
);

const FetchingPanel: React.FC<{ dm: boolean; text: string }> = ({ dm, text }) => (
  <div
    className={`relative rounded-2xl border ${dm ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-200'} p-12 md:p-16 flex flex-col items-center justify-center gap-5 min-h-[360px]`}
    role="status"
    aria-live="polite"
  >
    <div className="relative w-16 h-16">
      <div className={`absolute inset-0 rounded-full border-2 border-transparent animate-spin ${dm ? 'border-t-teal-400' : 'border-t-teal-600'}`} />
      <div
        className={`absolute inset-2 rounded-full border-2 border-transparent animate-spin ${dm ? 'border-b-teal-600' : 'border-b-teal-400'}`}
        style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
      />
      <div className={`absolute inset-[30%] rounded-full ${dm ? 'bg-teal-500' : 'bg-teal-600'} animate-pulse`} />
    </div>
    <div className="text-center">
      <p className={`flex items-center justify-center gap-2 text-sm font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>
        <Satellite size={16} className={dm ? 'text-teal-400' : 'text-teal-600'} />
        {text}
      </p>
      <p className={`mt-1.5 text-[11px] ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
        Hang tight — pulling from Carbon Mapper, IMEO (UNEP) and TROPOMI feeds, then resolving each point to a Nigerian state and nearest facility.
      </p>
    </div>
  </div>
);

const EmptyState: React.FC<{ dm: boolean }> = ({ dm }) => (
  <div className={`rounded-2xl border ${dm ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-200'} p-10 text-center`}>
    <p className={`text-sm font-bold ${dm ? 'text-white' : 'text-gray-900'} mb-2`}>No satellite history yet</p>
    <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
      Trends populate as Carbon Mapper, IMEO and TROPOMI feeds return data for the configured region. Open the Live Map to trigger an initial load.
    </p>
  </div>
);

export default MethaneTrends;
