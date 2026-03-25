import React, { useMemo, useState, useCallback } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Search } from "lucide-react";
import {
  useEmissionAggregations,
  useFacilities,
  useSatelliteSources,
} from "../src/hooks/useEmissions";
import { useSettingsStore } from "../src/stores/settings.store";
import type { Facility, NormalizedSource } from "../src/api/emissions.api";
import { formatEmission, getUnitLabel, type EmissionUnit } from "../src/utils/unit-conversion";

type SortDir = "asc" | "desc";

const TABS = [
  { id: "satellite", label: "Satellite Sources" },
  { id: "facilities", label: "Individual Sources" },
  { id: "rates", label: "Emission Rates" },
  { id: "cumulative", label: "Cumulative Totals" },
  { id: "averages", label: "Aggregated Averages" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface DataTabsProps {
  darkMode: boolean;
}

function providerLabel(p: string): string {
  return p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(s: string | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString();
}

function useSortState(defaultKey: string) {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const toggle = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev !== key) setSortDir("asc");
      else setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return key;
    });
  }, []);
  return { sortKey, sortDir, toggle };
}

function compareValues(a: string | number, b: string | number, dir: SortDir): number {
  const na = typeof a === "number" ? a : String(a).toLowerCase();
  const nb = typeof b === "number" ? b : String(b).toLowerCase();
  const cmp = na < nb ? -1 : na > nb ? 1 : 0;
  return dir === "asc" ? cmp : -cmp;
}

interface SortHeaderProps {
  label: string;
  colKey: string;
  activeKey: string;
  dir: SortDir;
  onSort: (k: string) => void;
  dm: boolean;
  className?: string;
}

function SortHeader({ label, colKey, activeKey, dir, onSort, dm, className = "" }: SortHeaderProps) {
  const active = activeKey === colKey;
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th scope="col" className={`px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide ${className}`}>
      <button
        type="button"
        onClick={() => onSort(colKey)}
        className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 -mx-1 transition-colors ${
          dm ? "text-gray-300 hover:bg-white/5 hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        } ${active ? (dm ? "text-teal-400" : "text-teal-600") : ""}`}
      >
        {label}
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
      </button>
    </th>
  );
}

export const DataTabs: React.FC<DataTabsProps> = ({ darkMode }) => {
  const dm = darkMode;
  const [activeTab, setActiveTab] = useState<TabId>("satellite");
  const [searchSat, setSearchSat] = useState("");
  const [searchFac, setSearchFac] = useState("");
  const [searchRates, setSearchRates] = useState("");
  const [searchCum, setSearchCum] = useState("");
  const [searchAvg, setSearchAvg] = useState("");

  const emissionUnit = useSettingsStore((s) => s.emissionUnit);

  const satelliteFilters = { gasType: "CH4" as const, page: 1, limit: 100 };
  const { data: satelliteRes, isLoading: loadingSat, isError: errSat } = useSatelliteSources(satelliteFilters);
  const { data: facilities = [], isLoading: loadingFac, isError: errFac } = useFacilities();
  const { data: aggregations, isLoading: loadingAgg, isError: errAgg } = useEmissionAggregations();

  const features = satelliteRes?.features ?? [];

  const sortSat = useSortState("name");
  const sortFac = useSortState("name");
  const sortRates = useSortState("name");
  const sortCum = useSortState("facilityName");
  const sortReg = useSortState("region");
  const sortOp = useSortState("operator");

  const rateStr = useCallback(
    (kgPerHr: number, unit: EmissionUnit) =>
      `${formatEmission(kgPerHr, unit)} ${getUnitLabel(unit)}`,
    [],
  );

  const filteredSortedSatellite = useMemo(() => {
    const q = searchSat.trim().toLowerCase();
    let rows = features.filter((f) => {
      if (!q) return true;
      const blob = [
        f.name,
        f.provider,
        f.latitude,
        f.longitude,
        f.emissionRate,
        f.gas,
        f.instrument,
        f.lastDetected,
      ]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });

    const key = sortSat.sortKey;
    const dir = sortSat.sortDir;
    const getters: Record<string, (r: NormalizedSource) => string | number> = {
      name: (r) => r.name,
      provider: (r) => providerLabel(r.provider),
      lat: (r) => r.latitude,
      lon: (r) => r.longitude,
      rate: (r) => r.emissionRate,
      gas: (r) => r.gas,
      instrument: (r) => r.instrument,
      lastDetected: (r) => r.lastDetected || "",
    };
    const get = getters[key] ?? getters.name;
    rows = [...rows].sort((a, b) => compareValues(get(a), get(b), dir));
    return rows;
  }, [features, searchSat, sortSat.sortKey, sortSat.sortDir]);

  const filteredSortedFacilities = useMemo(() => {
    const q = searchFac.trim().toLowerCase();
    let rows = (facilities as Facility[]).filter((f) => {
      if (!q) return true;
      const blob = [f.name, f.state, f.operator, f.sector, f.latitude, f.longitude, f.facilityType]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
    const key = sortFac.sortKey;
    const dir = sortFac.sortDir;
    const getters: Record<string, (r: Facility) => string | number> = {
      name: (r) => r.name,
      state: (r) => r.state || "",
      operator: (r) => r.operator || "",
      sector: (r) => r.sector,
      lat: (r) => r.latitude,
      lon: (r) => r.longitude,
      type: (r) => r.facilityType || "",
    };
    const get = getters[key] ?? getters.name;
    rows = [...rows].sort((a, b) => compareValues(get(a), get(b), dir));
    return rows;
  }, [facilities, searchFac, sortFac.sortKey, sortFac.sortDir]);

  const filteredSortedRates = useMemo(() => {
    const q = searchRates.trim().toLowerCase();
    let rows = features.filter((f) => {
      if (!q) return true;
      const blob = [f.name, f.provider, f.emissionRate, f.gas, f.persistence, f.plumeCount]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
    const key = sortRates.sortKey;
    const dir = sortRates.sortDir;
    const getters: Record<string, (r: NormalizedSource) => string | number> = {
      name: (r) => r.name,
      provider: (r) => providerLabel(r.provider),
      rate: (r) => r.emissionRate,
      gas: (r) => r.gas,
      persistence: (r) => r.persistence,
      plumeCount: (r) => r.plumeCount,
    };
    const get = getters[key] ?? getters.name;
    rows = [...rows].sort((a, b) => compareValues(get(a), get(b), dir));
    return rows;
  }, [features, searchRates, sortRates.sortKey, sortRates.sortDir]);

  const filteredSortedCumulative = useMemo(() => {
    const list = aggregations?.cumulativeByFacility ?? [];
    const q = searchCum.trim().toLowerCase();
    let rows = list.filter((r) => {
      if (!q) return true;
      const blob = [r.facilityName, r.totalEmission, r.count, r.latestDate].map((x) => String(x ?? "")).join(" ").toLowerCase();
      return blob.includes(q);
    });
    const key = sortCum.sortKey;
    const dir = sortCum.sortDir;
    const getters: Record<string, (r: (typeof list)[0]) => string | number> = {
      facilityName: (r) => r.facilityName,
      total: (r) => r.totalEmission,
      count: (r) => r.count,
      latestDate: (r) => r.latestDate || "",
    };
    const get = getters[key] ?? getters.facilityName;
    rows = [...rows].sort((a, b) => compareValues(get(a), get(b), dir));
    return rows;
  }, [aggregations, searchCum, sortCum.sortKey, sortCum.sortDir]);

  const filteredRegions = useMemo(() => {
    const list = aggregations?.byRegion ?? [];
    const q = searchAvg.trim().toLowerCase();
    let rows = list.filter((r) => {
      if (!q) return true;
      const blob = [r.region, r.avgReading, r.count].map((x) => String(x ?? "")).join(" ").toLowerCase();
      return blob.includes(q);
    });
    const key = sortReg.sortKey;
    const dir = sortReg.sortDir;
    const getters: Record<string, (r: (typeof list)[0]) => string | number> = {
      region: (r) => r.region,
      avg: (r) => r.avgReading,
      count: (r) => r.count,
    };
    const get = getters[key] ?? getters.region;
    rows = [...rows].sort((a, b) => compareValues(get(a), get(b), dir));
    return rows;
  }, [aggregations, searchAvg, sortReg.sortKey, sortReg.sortDir]);

  const filteredOperators = useMemo(() => {
    const list = aggregations?.byOperator ?? [];
    const q = searchAvg.trim().toLowerCase();
    let rows = list.filter((r) => {
      if (!q) return true;
      const blob = [r.operator, r.avgReading, r.count].map((x) => String(x ?? "")).join(" ").toLowerCase();
      return blob.includes(q);
    });
    const key = sortOp.sortKey;
    const dir = sortOp.sortDir;
    const getters: Record<string, (r: (typeof list)[0]) => string | number> = {
      operator: (r) => r.operator,
      avg: (r) => r.avgReading,
      count: (r) => r.count,
    };
    const get = getters[key] ?? getters.operator;
    rows = [...rows].sort((a, b) => compareValues(get(a), get(b), dir));
    return rows;
  }, [aggregations, searchAvg, sortOp.sortKey, sortOp.sortDir]);

  const shell = dm ? "bg-[#12161f] text-white" : "bg-white text-gray-900";
  const panel = dm ? "bg-[#1a1f2b] border-[#1e2430]" : "bg-gray-50 border-gray-200";
  const border = dm ? "border-[#1e2430]" : "border-gray-200";
  const inputCls = `w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
    dm ? "bg-[#12161f] border-[#1e2430] text-white placeholder:text-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
  } focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500`;
  const thRow = dm ? "bg-[#12161f]/80" : "bg-gray-100";
  const tdCls = dm ? "text-gray-200" : "text-gray-800";

  return (
    <div className={`flex flex-col h-full min-h-0 rounded-xl border overflow-hidden ${shell} ${border}`}>
      <div
        className={`flex flex-wrap gap-1 p-2 border-b shrink-0 ${border} ${
          dm ? "bg-[#1a1f2b]" : "bg-gray-50"
        }`}
        role="tablist"
      >
        {TABS.map((t) => {
          const on = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActiveTab(t.id)}
              className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                on
                  ? dm
                    ? "text-teal-400"
                    : "text-teal-600"
                  : dm
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {on && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-teal-500"
                  aria-hidden
                />
              )}
              <span className={on ? "relative" : ""}>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className={`flex-1 min-h-0 flex flex-col p-4 ${panel} border-0`}>
        {activeTab === "satellite" && (
          <>
            <div className="relative mb-3 shrink-0">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${dm ? "text-gray-500" : "text-gray-400"}`} />
              <input
                type="search"
                value={searchSat}
                onChange={(e) => setSearchSat(e.target.value)}
                placeholder="Search satellite sources…"
                className={inputCls}
                aria-label="Search satellite sources"
              />
            </div>
            <div className={`flex-1 min-h-0 overflow-auto rounded-lg border ${border} ${dm ? "bg-[#12161f]" : "bg-white"}`}>
              {loadingSat ? (
                <div className={`flex items-center justify-center gap-2 py-16 text-sm ${dm ? "text-gray-400" : "text-gray-500"}`}>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading…
                </div>
              ) : errSat ? (
                <p className={`py-16 text-center text-sm ${dm ? "text-red-400" : "text-red-600"}`}>Failed to load satellite sources.</p>
              ) : filteredSortedSatellite.length === 0 ? (
                <p className={`py-16 text-center text-sm ${dm ? "text-gray-500" : "text-gray-500"}`}>No data</p>
              ) : (
                <table className="w-full min-w-[720px] text-sm">
                  <thead className={thRow}>
                    <tr className={`border-b ${border}`}>
                      <SortHeader label="Name" colKey="name" activeKey={sortSat.sortKey} dir={sortSat.sortDir} onSort={sortSat.toggle} dm={dm} />
                      <SortHeader label="Provider" colKey="provider" activeKey={sortSat.sortKey} dir={sortSat.sortDir} onSort={sortSat.toggle} dm={dm} />
                      <SortHeader label="Lat" colKey="lat" activeKey={sortSat.sortKey} dir={sortSat.sortDir} onSort={sortSat.toggle} dm={dm} />
                      <SortHeader label="Lon" colKey="lon" activeKey={sortSat.sortKey} dir={sortSat.sortDir} onSort={sortSat.toggle} dm={dm} />
                      <SortHeader label="Emission rate" colKey="rate" activeKey={sortSat.sortKey} dir={sortSat.sortDir} onSort={sortSat.toggle} dm={dm} />
                      <SortHeader label="Gas" colKey="gas" activeKey={sortSat.sortKey} dir={sortSat.sortDir} onSort={sortSat.toggle} dm={dm} />
                      <SortHeader label="Instrument" colKey="instrument" activeKey={sortSat.sortKey} dir={sortSat.sortDir} onSort={sortSat.toggle} dm={dm} />
                      <SortHeader label="Last detected" colKey="lastDetected" activeKey={sortSat.sortKey} dir={sortSat.sortDir} onSort={sortSat.toggle} dm={dm} />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSortedSatellite.map((f) => (
                      <tr key={f.id} className={`border-b ${border} ${dm ? "hover:bg-white/[0.04]" : "hover:bg-gray-50"}`}>
                        <td className={`px-3 py-2 font-medium ${tdCls}`}>{f.name}</td>
                        <td className={`px-3 py-2 ${tdCls}`}>{providerLabel(f.provider)}</td>
                        <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{f.latitude.toFixed(4)}</td>
                        <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{f.longitude.toFixed(4)}</td>
                        <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{rateStr(f.emissionRate, emissionUnit)}</td>
                        <td className={`px-3 py-2 ${tdCls}`}>{f.gas}</td>
                        <td className={`px-3 py-2 ${tdCls}`}>{f.instrument}</td>
                        <td className={`px-3 py-2 ${tdCls}`}>{formatDate(f.lastDetected)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {activeTab === "facilities" && (
          <>
            <div className="relative mb-3 shrink-0">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${dm ? "text-gray-500" : "text-gray-400"}`} />
              <input
                type="search"
                value={searchFac}
                onChange={(e) => setSearchFac(e.target.value)}
                placeholder="Search facilities…"
                className={inputCls}
                aria-label="Search facilities"
              />
            </div>
            <div className={`flex-1 min-h-0 overflow-auto rounded-lg border ${border} ${dm ? "bg-[#12161f]" : "bg-white"}`}>
              {loadingFac ? (
                <div className={`flex items-center justify-center gap-2 py-16 text-sm ${dm ? "text-gray-400" : "text-gray-500"}`}>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading…
                </div>
              ) : errFac ? (
                <p className={`py-16 text-center text-sm ${dm ? "text-red-400" : "text-red-600"}`}>Failed to load facilities.</p>
              ) : filteredSortedFacilities.length === 0 ? (
                <p className={`py-16 text-center text-sm ${dm ? "text-gray-500" : "text-gray-500"}`}>No data</p>
              ) : (
                <table className="w-full min-w-[800px] text-sm">
                  <thead className={thRow}>
                    <tr className={`border-b ${border}`}>
                      <SortHeader label="Facility name" colKey="name" activeKey={sortFac.sortKey} dir={sortFac.sortDir} onSort={sortFac.toggle} dm={dm} />
                      <SortHeader label="State" colKey="state" activeKey={sortFac.sortKey} dir={sortFac.sortDir} onSort={sortFac.toggle} dm={dm} />
                      <SortHeader label="Operator" colKey="operator" activeKey={sortFac.sortKey} dir={sortFac.sortDir} onSort={sortFac.toggle} dm={dm} />
                      <SortHeader label="Sector" colKey="sector" activeKey={sortFac.sortKey} dir={sortFac.sortDir} onSort={sortFac.toggle} dm={dm} />
                      <SortHeader label="Lat" colKey="lat" activeKey={sortFac.sortKey} dir={sortFac.sortDir} onSort={sortFac.toggle} dm={dm} />
                      <SortHeader label="Lon" colKey="lon" activeKey={sortFac.sortKey} dir={sortFac.sortDir} onSort={sortFac.toggle} dm={dm} />
                      <SortHeader label="Type" colKey="type" activeKey={sortFac.sortKey} dir={sortFac.sortDir} onSort={sortFac.toggle} dm={dm} />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSortedFacilities.map((f) => (
                      <tr key={f.id} className={`border-b ${border} ${dm ? "hover:bg-white/[0.04]" : "hover:bg-gray-50"}`}>
                        <td className={`px-3 py-2 font-medium ${tdCls}`}>{f.name}</td>
                        <td className={`px-3 py-2 ${tdCls}`}>{f.state ?? "—"}</td>
                        <td className={`px-3 py-2 ${tdCls}`}>{f.operator ?? "—"}</td>
                        <td className={`px-3 py-2 ${tdCls}`}>{f.sector}</td>
                        <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{f.latitude.toFixed(4)}</td>
                        <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{f.longitude.toFixed(4)}</td>
                        <td className={`px-3 py-2 ${tdCls}`}>{f.facilityType ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {activeTab === "rates" && (
          <>
            <div className="relative mb-3 shrink-0">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${dm ? "text-gray-500" : "text-gray-400"}`} />
              <input
                type="search"
                value={searchRates}
                onChange={(e) => setSearchRates(e.target.value)}
                placeholder="Search emission rates…"
                className={inputCls}
                aria-label="Search emission rates"
              />
            </div>
            <div className={`flex-1 min-h-0 overflow-auto rounded-lg border ${border} ${dm ? "bg-[#12161f]" : "bg-white"}`}>
              {loadingSat ? (
                <div className={`flex items-center justify-center gap-2 py-16 text-sm ${dm ? "text-gray-400" : "text-gray-500"}`}>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading…
                </div>
              ) : errSat ? (
                <p className={`py-16 text-center text-sm ${dm ? "text-red-400" : "text-red-600"}`}>Failed to load sources.</p>
              ) : filteredSortedRates.length === 0 ? (
                <p className={`py-16 text-center text-sm ${dm ? "text-gray-500" : "text-gray-500"}`}>No data</p>
              ) : (
                <table className="w-full min-w-[640px] text-sm">
                  <thead className={thRow}>
                    <tr className={`border-b ${border}`}>
                      <SortHeader label="Source name" colKey="name" activeKey={sortRates.sortKey} dir={sortRates.sortDir} onSort={sortRates.toggle} dm={dm} />
                      <SortHeader label="Provider" colKey="provider" activeKey={sortRates.sortKey} dir={sortRates.sortDir} onSort={sortRates.toggle} dm={dm} />
                      <SortHeader label="Rate" colKey="rate" activeKey={sortRates.sortKey} dir={sortRates.sortDir} onSort={sortRates.toggle} dm={dm} />
                      <SortHeader label="Gas" colKey="gas" activeKey={sortRates.sortKey} dir={sortRates.sortDir} onSort={sortRates.toggle} dm={dm} />
                      <SortHeader label="Persistence" colKey="persistence" activeKey={sortRates.sortKey} dir={sortRates.sortDir} onSort={sortRates.toggle} dm={dm} />
                      <SortHeader label="Plume count" colKey="plumeCount" activeKey={sortRates.sortKey} dir={sortRates.sortDir} onSort={sortRates.toggle} dm={dm} />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSortedRates.map((f) => (
                      <tr key={f.id} className={`border-b ${border} ${dm ? "hover:bg-white/[0.04]" : "hover:bg-gray-50"}`}>
                        <td className={`px-3 py-2 font-medium ${tdCls}`}>{f.name}</td>
                        <td className={`px-3 py-2 ${tdCls}`}>{providerLabel(f.provider)}</td>
                        <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{rateStr(f.emissionRate, emissionUnit)}</td>
                        <td className={`px-3 py-2 ${tdCls}`}>{f.gas}</td>
                        <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{f.persistence}</td>
                        <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{f.plumeCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {activeTab === "cumulative" && (
          <>
            <div className="relative mb-3 shrink-0">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${dm ? "text-gray-500" : "text-gray-400"}`} />
              <input
                type="search"
                value={searchCum}
                onChange={(e) => setSearchCum(e.target.value)}
                placeholder="Search cumulative totals…"
                className={inputCls}
                aria-label="Search cumulative totals"
              />
            </div>
            <div className={`flex-1 min-h-0 overflow-auto rounded-lg border ${border} ${dm ? "bg-[#12161f]" : "bg-white"}`}>
              {loadingAgg ? (
                <div className={`flex items-center justify-center gap-2 py-16 text-sm ${dm ? "text-gray-400" : "text-gray-500"}`}>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading…
                </div>
              ) : errAgg ? (
                <p className={`py-16 text-center text-sm ${dm ? "text-red-400" : "text-red-600"}`}>Failed to load aggregations.</p>
              ) : filteredSortedCumulative.length === 0 ? (
                <p className={`py-16 text-center text-sm ${dm ? "text-gray-500" : "text-gray-500"}`}>No data</p>
              ) : (
                <table className="w-full min-w-[560px] text-sm">
                  <thead className={thRow}>
                    <tr className={`border-b ${border}`}>
                      <SortHeader label="Facility name" colKey="facilityName" activeKey={sortCum.sortKey} dir={sortCum.sortDir} onSort={sortCum.toggle} dm={dm} />
                      <SortHeader label="Total emission" colKey="total" activeKey={sortCum.sortKey} dir={sortCum.sortDir} onSort={sortCum.toggle} dm={dm} />
                      <SortHeader label="Measurement count" colKey="count" activeKey={sortCum.sortKey} dir={sortCum.sortDir} onSort={sortCum.toggle} dm={dm} />
                      <SortHeader label="Latest date" colKey="latestDate" activeKey={sortCum.sortKey} dir={sortCum.sortDir} onSort={sortCum.toggle} dm={dm} />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSortedCumulative.map((r) => (
                      <tr key={r.facilityId} className={`border-b ${border} ${dm ? "hover:bg-white/[0.04]" : "hover:bg-gray-50"}`}>
                        <td className={`px-3 py-2 font-medium ${tdCls}`}>{r.facilityName}</td>
                        <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{rateStr(r.totalEmission, emissionUnit)}</td>
                        <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{r.count}</td>
                        <td className={`px-3 py-2 ${tdCls}`}>{formatDate(r.latestDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {activeTab === "averages" && (
          <>
            <div className="relative mb-3 shrink-0">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${dm ? "text-gray-500" : "text-gray-400"}`} />
              <input
                type="search"
                value={searchAvg}
                onChange={(e) => setSearchAvg(e.target.value)}
                placeholder="Search regions and operators…"
                className={inputCls}
                aria-label="Search aggregated averages"
              />
            </div>
            <div className="flex-1 min-h-0 overflow-auto space-y-6">
              {loadingAgg ? (
                <div className={`flex items-center justify-center gap-2 py-16 text-sm ${dm ? "text-gray-400" : "text-gray-500"}`}>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading…
                </div>
              ) : errAgg ? (
                <p className={`py-16 text-center text-sm ${dm ? "text-red-400" : "text-red-600"}`}>Failed to load aggregations.</p>
              ) : (
                <>
                  <div>
                    <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${dm ? "text-gray-400" : "text-gray-500"}`}>By region</h3>
                    <div className={`rounded-lg border overflow-auto ${border} ${dm ? "bg-[#12161f]" : "bg-white"}`}>
                      {filteredRegions.length === 0 ? (
                        <p className={`py-10 text-center text-sm ${dm ? "text-gray-500" : "text-gray-500"}`}>No data</p>
                      ) : (
                        <table className="w-full min-w-[420px] text-sm">
                          <thead className={thRow}>
                            <tr className={`border-b ${border}`}>
                              <SortHeader label="Region" colKey="region" activeKey={sortReg.sortKey} dir={sortReg.sortDir} onSort={sortReg.toggle} dm={dm} />
                              <SortHeader label="Avg reading" colKey="avg" activeKey={sortReg.sortKey} dir={sortReg.sortDir} onSort={sortReg.toggle} dm={dm} />
                              <SortHeader label="Count" colKey="count" activeKey={sortReg.sortKey} dir={sortReg.sortDir} onSort={sortReg.toggle} dm={dm} />
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRegions.map((r) => (
                              <tr key={r.region} className={`border-b ${border} ${dm ? "hover:bg-white/[0.04]" : "hover:bg-gray-50"}`}>
                                <td className={`px-3 py-2 font-medium ${tdCls}`}>{r.region}</td>
                                <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{rateStr(r.avgReading, emissionUnit)}</td>
                                <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{r.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${dm ? "text-gray-400" : "text-gray-500"}`}>By operator</h3>
                    <div className={`rounded-lg border overflow-auto ${border} ${dm ? "bg-[#12161f]" : "bg-white"}`}>
                      {filteredOperators.length === 0 ? (
                        <p className={`py-10 text-center text-sm ${dm ? "text-gray-500" : "text-gray-500"}`}>No data</p>
                      ) : (
                        <table className="w-full min-w-[420px] text-sm">
                          <thead className={thRow}>
                            <tr className={`border-b ${border}`}>
                              <SortHeader label="Operator" colKey="operator" activeKey={sortOp.sortKey} dir={sortOp.sortDir} onSort={sortOp.toggle} dm={dm} />
                              <SortHeader label="Avg reading" colKey="avg" activeKey={sortOp.sortKey} dir={sortOp.sortDir} onSort={sortOp.toggle} dm={dm} />
                              <SortHeader label="Count" colKey="count" activeKey={sortOp.sortKey} dir={sortOp.sortDir} onSort={sortOp.toggle} dm={dm} />
                            </tr>
                          </thead>
                          <tbody>
                            {filteredOperators.map((r) => (
                              <tr key={r.operator} className={`border-b ${border} ${dm ? "hover:bg-white/[0.04]" : "hover:bg-gray-50"}`}>
                                <td className={`px-3 py-2 font-medium ${tdCls}`}>{r.operator}</td>
                                <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{rateStr(r.avgReading, emissionUnit)}</td>
                                <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{r.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DataTabs;
