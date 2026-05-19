import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  Building2,
  Flame,
  Satellite,
  Map,
  ArrowRight,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useDashboardSummary, useSatelliteSources } from "../src/hooks/useEmissions";
import { useSatelliteStore } from "../src/stores/satellite.store";
import { useSettingsStore } from "../src/stores/settings.store";
import { useDashboardStore } from "../src/stores/dashboard.store";
import {
  convertEmission,
  formatEmission,
  getUnitLabel,
} from "../src/utils/unit-conversion";
import Preloader from "./Preloader";
import { feedColor } from "./methane-trends/feeds";
import type { ProviderId } from "./methane-trends/types";

/** Trend chart shows the last 7 calendar days, one bucket per UTC date. */
const TREND_DAYS = 7;
const PROVIDER_KEYS: ProviderId[] = ["carbon_mapper", "imeo", "tropomi"];
const PROVIDER_LABELS: Record<ProviderId, string> = {
  carbon_mapper: "Carbon Mapper",
  imeo: "IMEO (UNEP)",
  tropomi: "TROPOMI",
};
// Reuse the same hue palette as the Methane Trends screen so the dashboard
// agrees with what the user sees when they drill in.
const PROVIDER_COLORS: Record<ProviderId, string> = {
  carbon_mapper: feedColor("carbon_mapper", "carbon_mapper"),
  imeo: feedColor("imeo", "imeo"),
  tropomi: feedColor("tropomi", "tropomi"),
};

interface DashboardHomeProps {
  darkMode: boolean;
  onNavigate?: (view: string) => void;
}

function severityBadgeClass(severity: string, dark: boolean): string {
  const s = severity.toLowerCase();
  if (s === "critical" || s === "high") {
    return dark
      ? "bg-red-500/20 text-red-300 border-red-500/40"
      : "bg-red-50 text-red-700 border-red-200";
  }
  if (s === "medium" || s === "warning") {
    return dark
      ? "bg-amber-500/20 text-amber-200 border-amber-500/40"
      : "bg-amber-50 text-amber-800 border-amber-200";
  }
  return dark
    ? "bg-slate-500/20 text-slate-300 border-slate-500/40"
    : "bg-gray-100 text-gray-700 border-gray-200";
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ darkMode, onNavigate }) => {
  const dm = darkMode;
  const { data, isLoading, isError, error } = useDashboardSummary();
  const emissionUnit = useSettingsStore((s) => s.emissionUnit);
  const setActiveView = useDashboardStore((s) => s.setActiveView);

  // Trigger a satellite fetch if the user landed on the dashboard before visiting the map.
  // React Query dedupes the request with LiveMap's existing call.
  useSatelliteSources({ gasType: "CH4", page: 1, limit: 100, bbox: "3,4,15,14" });
  const satelliteSources = useSatelliteStore((s) => s.sources);

  const topFiveAlerts = useMemo(() => {
    const list = data?.recentAlerts ?? [];
    return [...list]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [data?.recentAlerts]);

  /**
   * 7-day per-source trend.
   *
   * The previous version aggregated rows from the `alerts` table into a single line —
   * which hides which feed (Carbon Mapper / IMEO / TROPOMI) actually drove emissions.
   * This now derives the trend directly from the live satellite sources so each
   * provider gets its own series on the chart.
   */
  const last7Days = useMemo(() => {
    const days: { day: string; iso: string }[] = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    for (let i = TREND_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      days.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        iso: d.toISOString().slice(0, 10),
      });
    }
    return days;
  }, []);

  const sevenDaysAgoMs = useMemo(() => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - (TREND_DAYS - 1));
    return d.getTime();
  }, []);

  /** Per-provider × per-day total emission rate (kg/hr) over the last 7 days. */
  const totalsByProviderDay = useMemo(() => {
    const totals: Record<ProviderId, Record<string, number>> = {
      carbon_mapper: {},
      imeo: {},
      tropomi: {},
    };
    for (const s of satelliteSources) {
      const provider = (s.provider as ProviderId) ?? "carbon_mapper";
      if (!totals[provider]) continue;
      const dateStr = s.lastDetected || s.firstDetected;
      if (!dateStr) continue;
      const t = new Date(dateStr).getTime();
      if (!Number.isFinite(t) || t < sevenDaysAgoMs) continue;
      const iso = new Date(t).toISOString().slice(0, 10);
      const rate = Number(s.emissionRate ?? 0);
      if (!Number.isFinite(rate) || rate <= 0) continue;
      totals[provider][iso] = (totals[provider][iso] ?? 0) + rate;
    }
    return totals;
  }, [satelliteSources, sevenDaysAgoMs]);

  /** Provider series that actually had observations in the last 7 days. */
  const activeProviders = useMemo(() => {
    return PROVIDER_KEYS.filter((p) =>
      Object.values(totalsByProviderDay[p]).some((v) => v > 0),
    );
  }, [totalsByProviderDay]);

  const hasSatelliteTrend = activeProviders.length > 0;

  /**
   * Recharts row shape: `{ day, carbon_mapper, imeo, tropomi }`. Missing values
   * are coerced to `0` so the stacked area chart doesn't break on gaps.
   */
  const trendData = useMemo(() => {
    return last7Days.map(({ day, iso }) => {
      const row: Record<string, number | string> = { day };
      for (const p of PROVIDER_KEYS) {
        const raw = totalsByProviderDay[p][iso] ?? 0;
        row[p] = convertEmission(raw, emissionUnit);
      }
      return row;
    });
  }, [last7Days, totalsByProviderDay, emissionUnit]);

  const cardBase = dm
    ? "rounded-xl border border-[#1e2430] bg-[#1a1f2b] text-white shadow-lg shadow-black/20"
    : "rounded-xl border border-gray-200 bg-white text-gray-900 shadow-md shadow-gray-200/50";

  const muted = dm ? "text-slate-400" : "text-gray-500";
  const sectionTitle = dm ? "text-white" : "text-gray-900";
  const tableHead = dm ? "text-slate-400" : "text-gray-500";
  const tableRowBorder = dm ? "border-[#1e2430]" : "border-gray-100";
  const cardSectionBorder = dm ? "border-[#1e2430]" : "border-gray-200";
  const innerMutedBg = dm ? "bg-[#12161f]/80" : "bg-gray-50";

  const chartStroke = "#0d9488";
  const axisColor = dm ? "#64748b" : "#9ca3af";
  const gridColor = dm ? "#1e2430" : "#e5e7eb";

  if (isLoading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          dm
            ? "border-[#1e2430] bg-[#12161f] text-slate-300"
            : "border-gray-200 bg-gray-50 text-gray-600"
        }`}
      >
        <Preloader darkMode={dm} mapLoaded={false} isLoadingData={isLoading} />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          dm
            ? "border-red-500/30 bg-[#1a1f2b] text-red-300"
            : "border-red-200 bg-red-50 text-red-800"
        }`}
      >
        {error instanceof Error ? error.message : "Failed to load dashboard."}
      </div>
    );
  }

  const summary = data!;

  const emissionDisplay = `${formatEmission(
    summary.totalSatelliteEmissionRate,
    emissionUnit,
  )} ${getUnitLabel(emissionUnit)}`;

  const kpis = [
    {
      label: "Total Facilities",
      value: summary.totalFacilities.toLocaleString(),
      icon: Building2,
      subtitle: "Registered ground facilities",
    },
    {
      label: "Satellite-Detected Sources",
      value: summary.activeSatelliteSources.toLocaleString(),
      icon: Satellite,
      subtitle: "Emission points detected by all satellite providers",
    },
    {
      label: "Total Emission Rate",
      value: emissionDisplay,
      icon: Flame,
      subtitle: "Aggregated from satellite observations",
    },
    {
      label: "Alerts This Week",
      value: summary.alertsThisWeek.toLocaleString(),
      icon: Bell,
      subtitle: "Threshold exceedances this week",
    },
  ];

  const providers = (summary as any)?.providers ?? [];

  const quickActions = [
    { label: "View Live Map", icon: Map, view: "LIVE_MAP" as const },
    { label: "View Alerts", icon: AlertTriangle, view: "ALERTS" as const },
    { label: "Manage Data", icon: FileText, view: "MANAGE_DATA" as const },
  ];

  const dataSources = [
    { name: "Carbon Mapper", id: "carbon_mapper", desc: "Satellite methane detection" },
    { name: "UNEP IMEO", id: "imeo", desc: "International Methane Observatory" },
    { name: "TROPOMI", id: "tropomi", desc: "Sentinel-5P satellite data" },
  ];

  return (
    <div
      className={`space-y-6 p-4 sm:p-6 pb-16 overflow-y-auto ${
        dm ? "bg-[#12161f] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, subtitle }) => (
          <div key={label} className={`${cardBase} p-5`} title={subtitle}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-medium ${muted}`}>{label}</p>
                <p
                  className={`mt-2 text-2xl font-semibold tracking-tight ${sectionTitle}`}
                >
                  {value}
                </p>
                <p className={`mt-1 text-xs ${muted} opacity-70`}>{subtitle}</p>
              </div>
              <div className="rounded-lg bg-teal-600/15 p-2.5 text-teal-500">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={cardBase}>
        <div className={`border-b px-5 py-4 flex items-start justify-between gap-4 ${cardSectionBorder}`}>
          <div>
            <h2 className={`text-lg font-semibold ${sectionTitle}`}>
              Emission trend (7 days)
            </h2>
            <p className={`mt-1 text-sm ${muted}`}>
              {hasSatelliteTrend
                ? `Daily total emission rate by data source (${getUnitLabel(emissionUnit)})`
                : `No satellite data in the last 7 days yet — chart populates as Carbon Mapper, IMEO and TROPOMI feeds load (${getUnitLabel(emissionUnit)})`}
            </p>
          </div>
          {hasSatelliteTrend && (
            <ul className="hidden md:flex items-center gap-3 flex-shrink-0">
              {activeProviders.map((p) => (
                <li key={p} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: dm ? '#cbd5e1' : '#475569' }}>
                  <span aria-hidden className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[p] }} />
                  {PROVIDER_LABELS[p]}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={`h-72 p-4 ${innerMutedBg}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                {PROVIDER_KEYS.map((p) => (
                  <linearGradient key={p} id={`dashAreaFill-${p}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PROVIDER_COLORS[p]} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={PROVIDER_COLORS[p]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="day"
                tick={{ fill: axisColor, fontSize: 12 }}
                axisLine={{ stroke: gridColor }}
                tickLine={{ stroke: gridColor }}
              />
              <YAxis
                tick={{ fill: axisColor, fontSize: 12 }}
                axisLine={{ stroke: gridColor }}
                tickLine={{ stroke: gridColor }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: dm ? "#1a1f2b" : "#fff",
                  border: dm ? "1px solid #1e2430" : "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  color: dm ? "#fff" : "#111827",
                }}
                formatter={(value: number, name: string) => {
                  const provider = name as ProviderId;
                  return [
                    `${formatEmission(Number(value), emissionUnit)} ${getUnitLabel(emissionUnit)}`,
                    PROVIDER_LABELS[provider] ?? name,
                  ];
                }}
              />
              <Legend content={() => null} />
              {PROVIDER_KEYS.map((p) => (
                <Area
                  key={p}
                  type="monotone"
                  dataKey={p}
                  name={p}
                  stackId="providers"
                  stroke={PROVIDER_COLORS[p]}
                  strokeWidth={2}
                  fill={`url(#dashAreaFill-${p})`}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {hasSatelliteTrend && (
          <ul className="md:hidden flex flex-wrap items-center gap-3 px-5 py-3 border-t" style={{ borderColor: dm ? '#1e2430' : '#e5e7eb' }}>
            {activeProviders.map((p) => (
              <li key={p} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: dm ? '#cbd5e1' : '#475569' }}>
                <span aria-hidden className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[p] }} />
                {PROVIDER_LABELS[p]}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={cardBase}>
          <div className={`border-b px-5 py-4 ${cardSectionBorder}`}>
            <h2 className={`text-lg font-semibold ${sectionTitle}`}>
              Top emitters
            </h2>
            <p className={`mt-1 text-sm ${muted}`}>
              By aggregated facility readings
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={`border-b ${tableRowBorder}`}>
                  <th className={`px-5 py-3 font-medium ${tableHead}`}>
                    Facility
                  </th>
                  <th className={`px-5 py-3 font-medium ${tableHead}`}>
                    Total reading
                  </th>
                  <th className={`px-5 py-3 font-medium ${tableHead}`}>
                    Measurements
                  </th>
                </tr>
              </thead>
              <tbody>
                {(summary.topFacilities ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className={`px-5 py-8 text-center ${muted}`}
                    >
                      No facility data yet.
                    </td>
                  </tr>
                ) : (
                  summary.topFacilities.map((row: any) => (
                    <tr
                      key={row.facilityId}
                      className={`border-b ${tableRowBorder} last:border-0`}
                    >
                      <td className="px-5 py-3 font-medium">{row.facilityName}</td>
                      <td className="px-5 py-3">
                        {formatEmission(row.totalReading, emissionUnit)}{" "}
                        <span className={muted}>{getUnitLabel(emissionUnit)}</span>
                      </td>
                      <td className="px-5 py-3">{row.measurementCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={cardBase}>
          <div className={`border-b px-5 py-4 ${cardSectionBorder}`}>
            <h2 className={`text-lg font-semibold ${sectionTitle}`}>
              Recent alerts
            </h2>
            <p className={`mt-1 text-sm ${muted}`}>
              Latest five by time
            </p>
          </div>
          <ul
            className={
              dm ? "divide-y divide-[#1e2430]" : "divide-y divide-gray-100"
            }
          >
            {topFiveAlerts.length === 0 ? (
              <li className={`px-5 py-8 text-center text-sm ${muted}`}>
                No alerts in the selected window.
              </li>
            ) : (
              topFiveAlerts.map((alert) => (
                <li key={alert.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug">{alert.title}</p>
                      <p className={`mt-1 text-xs ${muted}`}>
                        {new Date(alert.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}{" "}
                        ·{" "}
                        {formatEmission(alert.emissionRate, emissionUnit)}{" "}
                        {getUnitLabel(emissionUnit)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${severityBadgeClass(alert.severity, dm)}`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={cardBase}>
        <div className={`border-b px-5 py-4 ${cardSectionBorder}`}>
          <h2 className={`text-lg font-semibold ${sectionTitle}`}>Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5">
          {quickActions.map(({ label, icon: Icon, view }) => (
            <button
              key={view}
              onClick={() => { onNavigate?.(view); setActiveView(view); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group ${
                dm
                  ? "border-[#1e2430] hover:border-teal-500/40 hover:bg-teal-500/5"
                  : "border-gray-200 hover:border-teal-300 hover:bg-teal-50"
              }`}
            >
              <div className="rounded-lg bg-teal-600/15 p-2 text-teal-500">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </div>
              <span className={`text-sm font-medium ${dm ? "text-gray-200" : "text-gray-700"}`}>{label}</span>
              <ArrowRight className={`h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity ${muted}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Data Sources Status */}
      <div className={cardBase}>
        <div className={`border-b px-5 py-4 ${cardSectionBorder}`}>
          <h2 className={`text-lg font-semibold ${sectionTitle}`}>Data Sources</h2>
          <p className={`mt-1 text-sm ${muted}`}>Connection status for emission data providers</p>
        </div>
        <div className="divide-y divide-inherit">
          {dataSources.map((src) => {
            const connected = providers.includes(src.id);
            return (
              <div key={src.id} className="flex items-center gap-4 px-5 py-4">
                <div className={`flex-shrink-0 ${connected ? "text-emerald-500" : dm ? "text-gray-600" : "text-gray-300"}`}>
                  {connected ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${dm ? "text-gray-200" : "text-gray-800"}`}>{src.name}</p>
                  <p className={`text-xs ${muted}`}>{src.desc}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  connected
                    ? dm ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                    : dm ? "bg-gray-500/15 text-gray-500" : "bg-gray-100 text-gray-400"
                }`}>
                  {connected ? "Connected" : "Not configured"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
