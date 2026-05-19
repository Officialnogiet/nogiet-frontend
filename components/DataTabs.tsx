import React, { useMemo, useState, useCallback } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Loader2, Search } from "lucide-react";
import {
  useEmissionAggregations,
  useFacilities,
  useSatelliteSources,
} from "../src/hooks/useEmissions";
import { useSettingsStore } from "../src/stores/settings.store";
import type { Facility, NormalizedSource } from "../src/api/emissions.api";
import { formatEmission, getUnitLabel, type EmissionUnit } from "../src/utils/unit-conversion";
import { feedColor } from "./methane-trends/feeds";
import type { ProviderId } from "./methane-trends/types";

/** Color swatch reused from the live map / methane trends so providers stay visually consistent. */
function providerSwatch(provider: string, instrument: string): string {
  return feedColor(provider as ProviderId, instrument);
}

type SortDir = "asc" | "desc";

const TABS = [
  { id: "all", label: "All Sources" },
  { id: "instruments", label: "By Instrument" },
  { id: "rates", label: "Emission Rates" },
  { id: "cumulative", label: "Cumulative" },
  { id: "averages", label: "Averages" },
] as const;

const SATELLITE_INSTRUMENTS: Record<string, string> = {
  emit: "NASA EMIT (ISS)",
  "aviris-ng": "NASA AVIRIS-NG (Airborne)",
  "aviris-3": "NASA AVIRIS-3 (Airborne)",
  tanager: "Planet Tanager-1 (Satellite)",
  gao: "ASU GAO (Airborne)",
  emu: "EMU",
};

type TabId = (typeof TABS)[number]["id"];

interface DataTabsProps {
  darkMode: boolean;
}

interface UnifiedSource {
  id: string;
  name: string;
  sourceType: "Satellite" | "Facility";
  providerOrOperator: string;
  latitude: number;
  longitude: number;
  emissionRate: number;
  gas: string;
  lastDate: string;
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

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const csv = [
    headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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

function EmptyState({ dm, text }: { dm: boolean; text: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 ${dm ? "text-gray-500" : "text-gray-400"}`}>
      <Search className="h-8 w-8 opacity-40" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

function LoadingState({ dm }: { dm: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 ${dm ? "text-gray-400" : "text-gray-500"}`}>
      <Loader2 className="h-8 w-8 animate-spin opacity-60" />
      <p className="text-sm">Loading data…</p>
    </div>
  );
}

export const DataTabs: React.FC<DataTabsProps> = ({ darkMode }) => {
  const dm = darkMode;
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [searchAll, setSearchAll] = useState("");
  const [searchInst, setSearchInst] = useState("");
  const [searchRates, setSearchRates] = useState("");
  const [searchCum, setSearchCum] = useState("");
  const [searchAvg, setSearchAvg] = useState("");

  const emissionUnit = useSettingsStore((s) => s.emissionUnit);

  const satelliteFilters = { gasType: "CH4" as const, page: 1, limit: 100 };
  const { data: satelliteRes, isLoading: loadingSat, isError: errSat } = useSatelliteSources(satelliteFilters);
  const { data: facilities = [], isLoading: loadingFac, isError: errFac } = useFacilities();
  const { data: aggregations, isLoading: loadingAgg, isError: errAgg } = useEmissionAggregations();

  const features: NormalizedSource[] = satelliteRes?.features ?? [];

  const sortAll = useSortState("name");
  const sortRates = useSortState("name");
  const sortCum = useSortState("facilityName");
  const sortReg = useSortState("region");
  const sortOp = useSortState("operator");

  const rateStr = useCallback(
    (kgPerHr: number, unit: EmissionUnit) =>
      kgPerHr > 0
        ? `${formatEmission(kgPerHr, unit)} ${getUnitLabel(unit)}`
        : "N/A",
    [],
  );

  const allSourcesUnified = useMemo<UnifiedSource[]>(() => {
    const satRows: UnifiedSource[] = features.map((f) => ({
      id: f.id,
      name: f.name,
      sourceType: "Satellite" as const,
      providerOrOperator: providerLabel(f.provider),
      latitude: f.latitude,
      longitude: f.longitude,
      emissionRate: f.emissionRate,
      gas: f.gas,
      lastDate: f.lastDetected || "",
    }));
    const facRows: UnifiedSource[] = (facilities as Facility[]).map((f) => ({
      id: f.id,
      name: f.name,
      sourceType: "Facility" as const,
      providerOrOperator: f.operator || "—",
      latitude: f.latitude,
      longitude: f.longitude,
      emissionRate: 0,
      gas: "—",
      lastDate: "",
    }));
    return [...satRows, ...facRows];
  }, [features, facilities]);

  const filteredAllSources = useMemo(() => {
    const q = searchAll.trim().toLowerCase();
    let rows = allSourcesUnified.filter((r) => {
      if (!q) return true;
      const blob = [
        r.name, r.sourceType, r.providerOrOperator,
        r.latitude, r.longitude, r.emissionRate, r.gas, r.lastDate,
      ]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
    const key = sortAll.sortKey;
    const dir = sortAll.sortDir;
    const getters: Record<string, (r: UnifiedSource) => string | number> = {
      name: (r) => r.name,
      type: (r) => r.sourceType,
      provider: (r) => r.providerOrOperator,
      lat: (r) => r.latitude,
      lon: (r) => r.longitude,
      rate: (r) => r.emissionRate,
      gas: (r) => r.gas,
      lastDate: (r) => r.lastDate,
    };
    const get = getters[key] ?? getters.name;
    rows = [...rows].sort((a, b) => compareValues(get(a), get(b), dir));
    return rows;
  }, [allSourcesUnified, searchAll, sortAll.sortKey, sortAll.sortDir]);

  const filteredByInstrument = useMemo(() => {
    const q = searchInst.trim().toLowerCase();
    const filtered = features.filter((f: NormalizedSource) => {
      if (!q) return true;
      const blob = [f.name, f.provider, f.instrument, f.sector, f.emissionRate, f.gas]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
    const grouped = new Map<string, NormalizedSource[]>();
    filtered.forEach((f) => {
      const key = f.instrument || "unknown";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(f);
    });
    return { total: filtered.length, grouped };
  }, [features, searchInst]);

  const filteredSortedRates = useMemo(() => {
    const q = searchRates.trim().toLowerCase();
    let rows = features.filter((f: NormalizedSource) => {
      if (!q) return true;
      const blob = [f.name, f.provider, f.instrument, f.emissionRate, f.gas, f.sector, f.persistence, f.plumeCount]
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
      instrument: (r) => r.instrument ?? "",
      sector: (r) => r.sector ?? "",
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
      const blob = [r.facilityName, r.totalEmission, r.count, r.latestDate]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();
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
      const blob = [r.region, r.avgReading, r.count]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();
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
      const blob = [r.operator, r.avgReading, r.count]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();
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

  const tabCounts = useMemo<Record<TabId, number>>(
    () => ({
      all: filteredAllSources.length,
      instruments: filteredByInstrument.total,
      rates: filteredSortedRates.length,
      cumulative: filteredSortedCumulative.length,
      averages: filteredRegions.length + filteredOperators.length,
    }),
    [filteredAllSources, filteredByInstrument, filteredSortedRates, filteredSortedCumulative, filteredRegions, filteredOperators],
  );

  const exportAllSources = useCallback(() => {
    const headers = ["Name", "Type", "Provider/Operator", "Latitude", "Longitude", "Emission Rate", "Gas", "Last Date"];
    const rows = filteredAllSources.map((r) => [
      r.name, r.sourceType, r.providerOrOperator,
      r.latitude.toFixed(4), r.longitude.toFixed(4),
      rateStr(r.emissionRate, emissionUnit), r.gas, formatDate(r.lastDate),
    ]);
    downloadCsv("all-sources.csv", headers, rows);
  }, [filteredAllSources, rateStr, emissionUnit]);

  const exportByInstrument = useCallback(() => {
    const headers = ["Instrument", "Source Name", "Provider", "Emission Rate", "Gas", "Plumes", "Sector", "Last Detected"];
    const rows: (string | number)[][] = [];
    filteredByInstrument.grouped.forEach((sources, instrument) => {
      sources.forEach((s) => {
        rows.push([
          instrument.toUpperCase(), s.name, providerLabel(s.provider),
          rateStr(s.emissionRate, emissionUnit), s.gas, s.plumeCount,
          s.sector || "—", formatDate(s.lastDetected),
        ]);
      });
    });
    downloadCsv("by-instrument.csv", headers, rows);
  }, [filteredByInstrument, rateStr, emissionUnit]);

  const exportRates = useCallback(() => {
    const headers = ["Source Name", "Provider", "Instrument", "Sector", "Rate", "Gas", "Persistence", "Plume Count"];
    const rows = filteredSortedRates.map((f) => [
      f.name,
      providerLabel(f.provider),
      f.instrument || "—",
      f.sector || "—",
      rateStr(f.emissionRate, emissionUnit),
      f.gas,
      f.persistence,
      f.plumeCount,
    ]);
    downloadCsv("emission-rates.csv", headers, rows);
  }, [filteredSortedRates, rateStr, emissionUnit]);

  const exportCumulative = useCallback(() => {
    const headers = ["Facility Name", "Total Emission", "Measurement Count", "Latest Date"];
    const rows = filteredSortedCumulative.map((r) => [
      r.facilityName, rateStr(r.totalEmission, emissionUnit), r.count, formatDate(r.latestDate),
    ]);
    downloadCsv("cumulative-totals.csv", headers, rows);
  }, [filteredSortedCumulative, rateStr, emissionUnit]);

  const exportAverages = useCallback(() => {
    const headers = ["Category", "Name", "Avg Reading", "Count"];
    const rows: (string | number)[][] = [
      ...filteredRegions.map((r) => ["Region", r.region, rateStr(r.avgReading, emissionUnit), r.count] as (string | number)[]),
      ...filteredOperators.map((r) => ["Operator", r.operator, rateStr(r.avgReading, emissionUnit), r.count] as (string | number)[]),
    ];
    downloadCsv("averages.csv", headers, rows);
  }, [filteredRegions, filteredOperators, rateStr, emissionUnit]);

  const shell = dm ? "bg-[#12161f] text-white" : "bg-white text-gray-900";
  const panel = dm ? "bg-[#1a1f2b] border-[#1e2430]" : "bg-gray-50 border-gray-200";
  const border = dm ? "border-[#1e2430]" : "border-gray-200";
  const inputCls = `w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
    dm
      ? "bg-[#12161f] border-[#1e2430] text-white placeholder:text-gray-500"
      : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
  } focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500`;
  const thRow = dm ? "bg-[#12161f]/80" : "bg-gray-100";
  const tdCls = dm ? "text-gray-200" : "text-gray-800";
  const badgeSat = dm ? "bg-sky-500/15 text-sky-400" : "bg-sky-50 text-sky-700";
  const badgeFac = dm ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-700";
  const dlBtnCls = `p-2 rounded-lg border transition-colors shrink-0 ${
    dm
      ? "border-[#1e2430] text-gray-400 hover:text-white hover:bg-white/5"
      : "border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
  }`;

  return (
    <div className={`flex flex-col h-full min-h-0 rounded-xl border overflow-hidden ${shell} ${border}`}>
      <div
        className={`flex flex-wrap gap-1 p-2 border-b shrink-0 ${border} ${dm ? "bg-[#1a1f2b]" : "bg-gray-50"}`}
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
              <span className={on ? "relative" : ""}>
                {t.label}
                <span
                  className={`ml-1.5 text-xs tabular-nums ${
                    on
                      ? dm
                        ? "text-teal-400/70"
                        : "text-teal-600/70"
                      : dm
                        ? "text-gray-500"
                        : "text-gray-400"
                  }`}
                >
                  ({tabCounts[t.id]})
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className={`flex-1 min-h-0 flex flex-col p-4 ${panel} border-0`}>
        {activeTab === "all" && (
          <>
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${dm ? "text-gray-500" : "text-gray-400"}`} />
                <input
                  type="search"
                  value={searchAll}
                  onChange={(e) => setSearchAll(e.target.value)}
                  placeholder="Search all sources…"
                  className={inputCls}
                  aria-label="Search all sources"
                />
              </div>
              <button type="button" onClick={exportAllSources} title="Export CSV" className={dlBtnCls}>
                <Download className="h-4 w-4" />
              </button>
            </div>
            <div className={`flex-1 min-h-0 overflow-auto rounded-lg border ${border} ${dm ? "bg-[#12161f]" : "bg-white"}`}>
              {loadingSat || loadingFac ? (
                <LoadingState dm={dm} />
              ) : errSat || errFac ? (
                <p className={`py-16 text-center text-sm ${dm ? "text-red-400" : "text-red-600"}`}>
                  Failed to load sources.
                </p>
              ) : filteredAllSources.length === 0 ? (
                <EmptyState dm={dm} text={searchAll ? "No sources match your search" : "No sources available"} />
              ) : (
                <table className="w-full min-w-[820px] text-sm">
                  <thead className={thRow}>
                    <tr className={`border-b ${border}`}>
                      <SortHeader label="Name" colKey="name" activeKey={sortAll.sortKey} dir={sortAll.sortDir} onSort={sortAll.toggle} dm={dm} />
                      <SortHeader label="Type" colKey="type" activeKey={sortAll.sortKey} dir={sortAll.sortDir} onSort={sortAll.toggle} dm={dm} />
                      <SortHeader label="Provider / Operator" colKey="provider" activeKey={sortAll.sortKey} dir={sortAll.sortDir} onSort={sortAll.toggle} dm={dm} />
                      <SortHeader label="Lat" colKey="lat" activeKey={sortAll.sortKey} dir={sortAll.sortDir} onSort={sortAll.toggle} dm={dm} />
                      <SortHeader label="Lon" colKey="lon" activeKey={sortAll.sortKey} dir={sortAll.sortDir} onSort={sortAll.toggle} dm={dm} />
                      <SortHeader label="Emission Rate" colKey="rate" activeKey={sortAll.sortKey} dir={sortAll.sortDir} onSort={sortAll.toggle} dm={dm} />
                      <SortHeader label="Gas" colKey="gas" activeKey={sortAll.sortKey} dir={sortAll.sortDir} onSort={sortAll.toggle} dm={dm} />
                      <SortHeader label="Last Detected" colKey="lastDate" activeKey={sortAll.sortKey} dir={sortAll.sortDir} onSort={sortAll.toggle} dm={dm} />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAllSources.map((r) => (
                      <tr key={`${r.sourceType}-${r.id}`} className={`border-b ${border} ${dm ? "hover:bg-white/[0.04]" : "hover:bg-gray-50"}`}>
                        <td className={`px-3 py-2 font-medium ${tdCls}`}>{r.name}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${r.sourceType === "Satellite" ? badgeSat : badgeFac}`}>
                            {r.sourceType}
                          </span>
                        </td>
                        <td className={`px-3 py-2 ${tdCls}`}>{r.providerOrOperator}</td>
                        <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{r.latitude.toFixed(4)}</td>
                        <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{r.longitude.toFixed(4)}</td>
                        <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{rateStr(r.emissionRate, emissionUnit)}</td>
                        <td className={`px-3 py-2 ${tdCls}`}>{r.gas}</td>
                        <td className={`px-3 py-2 ${tdCls}`}>{formatDate(r.lastDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {activeTab === "instruments" && (
          <>
            <p className={`text-xs mb-3 ${dm ? "text-gray-500" : "text-gray-400"}`}>
              Individual sources broken down by satellite instrument. Each instrument represents a different sensor used to detect emissions.
            </p>
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${dm ? "text-gray-500" : "text-gray-400"}`} />
                <input
                  type="search"
                  value={searchInst}
                  onChange={(e) => setSearchInst(e.target.value)}
                  placeholder="Search by source name, instrument, provider…"
                  className={inputCls}
                  aria-label="Search by instrument"
                />
              </div>
              <button type="button" onClick={exportByInstrument} title="Export CSV" className={dlBtnCls}>
                <Download className="h-4 w-4" />
              </button>
            </div>
            <div className={`flex-1 min-h-0 overflow-auto rounded-lg border ${border} ${dm ? "bg-[#12161f]" : "bg-white"}`}>
              {loadingSat ? (
                <LoadingState dm={dm} />
              ) : errSat ? (
                <p className={`py-16 text-center text-sm ${dm ? "text-red-400" : "text-red-600"}`}>
                  Failed to load sources.
                </p>
              ) : filteredByInstrument.grouped.size === 0 ? (
                <EmptyState dm={dm} text={searchInst ? "No sources match your search" : "No instrument data available"} />
              ) : (
                <div className="divide-y divide-inherit">
                  {Array.from(filteredByInstrument.grouped.entries()).map(([instrument, sources]) => (
                    <div key={instrument} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${dm ? "bg-teal-500/15 text-teal-400" : "bg-teal-50 text-teal-700"}`}>
                          {instrument.toUpperCase()}
                        </span>
                        <span className={`text-sm font-medium ${dm ? "text-gray-300" : "text-gray-700"}`}>
                          {SATELLITE_INSTRUMENTS[instrument] ?? instrument}
                        </span>
                        <span className={`text-xs ${dm ? "text-gray-500" : "text-gray-400"}`}>
                          {sources.length} source{sources.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <table className="w-full min-w-[640px] text-sm">
                        <thead className={thRow}>
                          <tr className={`border-b ${border}`}>
                            <th className={`px-3 py-2 text-left text-xs font-semibold uppercase ${dm ? "text-gray-400" : "text-gray-500"}`}>Source Name</th>
                            <th className={`px-3 py-2 text-left text-xs font-semibold uppercase ${dm ? "text-gray-400" : "text-gray-500"}`}>Provider</th>
                            <th className={`px-3 py-2 text-left text-xs font-semibold uppercase ${dm ? "text-gray-400" : "text-gray-500"}`}>Emission Rate</th>
                            <th className={`px-3 py-2 text-left text-xs font-semibold uppercase ${dm ? "text-gray-400" : "text-gray-500"}`}>Gas</th>
                            <th className={`px-3 py-2 text-left text-xs font-semibold uppercase ${dm ? "text-gray-400" : "text-gray-500"}`}>Plumes</th>
                            <th className={`px-3 py-2 text-left text-xs font-semibold uppercase ${dm ? "text-gray-400" : "text-gray-500"}`}>Sector</th>
                            <th className={`px-3 py-2 text-left text-xs font-semibold uppercase ${dm ? "text-gray-400" : "text-gray-500"}`}>Last Detected</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sources.map((s) => (
                            <tr key={s.id} className={`border-b ${border} ${dm ? "hover:bg-white/[0.04]" : "hover:bg-gray-50"}`}>
                              <td className={`px-3 py-2 font-medium ${tdCls}`}>{s.name}</td>
                              <td className={`px-3 py-2 ${tdCls}`}>{providerLabel(s.provider)}</td>
                              <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{rateStr(s.emissionRate, emissionUnit)}</td>
                              <td className={`px-3 py-2 ${tdCls}`}>{s.gas}</td>
                              <td className={`px-3 py-2 tabular-nums ${tdCls}`}>{s.plumeCount}</td>
                              <td className={`px-3 py-2 ${tdCls}`}>{s.sector || "—"}</td>
                              <td className={`px-3 py-2 ${tdCls}`}>{formatDate(s.lastDetected)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "rates" && (
          <>
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <div className="relative flex-1">
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
              <button type="button" onClick={exportRates} title="Export CSV" className={dlBtnCls}>
                <Download className="h-4 w-4" />
              </button>
            </div>
            <div className={`flex-1 min-h-0 overflow-auto rounded-lg border ${border} ${dm ? "bg-[#12161f]" : "bg-white"}`}>
              {loadingSat ? (
                <LoadingState dm={dm} />
              ) : errSat ? (
                <p className={`py-16 text-center text-sm ${dm ? "text-red-400" : "text-red-600"}`}>
                  Failed to load sources.
                </p>
              ) : filteredSortedRates.length === 0 ? (
                <EmptyState dm={dm} text={searchRates ? "No rates match your search" : "No emission rate data available"} />
              ) : (
                <table className="w-full min-w-[820px] text-sm">
                  <thead className={thRow}>
                    <tr className={`border-b ${border}`}>
                      <SortHeader label="Source name" colKey="name" activeKey={sortRates.sortKey} dir={sortRates.sortDir} onSort={sortRates.toggle} dm={dm} />
                      <SortHeader label="Provider" colKey="provider" activeKey={sortRates.sortKey} dir={sortRates.sortDir} onSort={sortRates.toggle} dm={dm} />
                      <SortHeader label="Instrument" colKey="instrument" activeKey={sortRates.sortKey} dir={sortRates.sortDir} onSort={sortRates.toggle} dm={dm} />
                      <SortHeader label="Sector" colKey="sector" activeKey={sortRates.sortKey} dir={sortRates.sortDir} onSort={sortRates.toggle} dm={dm} />
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
                        <td className={`px-3 py-2 ${tdCls}`}>
                          <span className="inline-flex items-center gap-1.5">
                            <span aria-hidden className="w-2 h-2 rounded-full" style={{ backgroundColor: providerSwatch(f.provider, f.instrument) }} />
                            {providerLabel(f.provider)}
                          </span>
                        </td>
                        <td className={`px-3 py-2 ${tdCls}`}>{f.instrument || <span className={dm ? "text-gray-600" : "text-gray-400"}>—</span>}</td>
                        <td className={`px-3 py-2 ${tdCls}`}>{f.sector || <span className={dm ? "text-gray-600" : "text-gray-400"}>—</span>}</td>
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
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <div className="relative flex-1">
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
              <button type="button" onClick={exportCumulative} title="Export CSV" className={dlBtnCls}>
                <Download className="h-4 w-4" />
              </button>
            </div>
            <div className={`flex-1 min-h-0 overflow-auto rounded-lg border ${border} ${dm ? "bg-[#12161f]" : "bg-white"}`}>
              {loadingAgg ? (
                <LoadingState dm={dm} />
              ) : errAgg ? (
                <p className={`py-16 text-center text-sm ${dm ? "text-red-400" : "text-red-600"}`}>
                  Failed to load aggregations.
                </p>
              ) : filteredSortedCumulative.length === 0 ? (
                <EmptyState dm={dm} text={searchCum ? "No results match your search" : "No cumulative data available"} />
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
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <div className="relative flex-1">
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
              <button type="button" onClick={exportAverages} title="Export CSV" className={dlBtnCls}>
                <Download className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto space-y-6">
              {loadingAgg ? (
                <LoadingState dm={dm} />
              ) : errAgg ? (
                <p className={`py-16 text-center text-sm ${dm ? "text-red-400" : "text-red-600"}`}>
                  Failed to load aggregations.
                </p>
              ) : (
                <>
                  <div>
                    <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${dm ? "text-gray-400" : "text-gray-500"}`}>By region</h3>
                    <div className={`rounded-lg border overflow-auto ${border} ${dm ? "bg-[#12161f]" : "bg-white"}`}>
                      {filteredRegions.length === 0 ? (
                        <EmptyState dm={dm} text={searchAvg ? "No regions match your search" : "No region data available"} />
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
                        <EmptyState dm={dm} text={searchAvg ? "No operators match your search" : "No operator data available"} />
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
