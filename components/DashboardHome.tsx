import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  Building2,
  Flame,
  Loader2,
  Satellite,
  Map,
  Hexagon,
  ArrowRight,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useDashboardSummary } from "../src/hooks/useEmissions";
import { useSettingsStore } from "../src/stores/settings.store";
import { useDashboardStore } from "../src/stores/dashboard.store";
import {
  convertEmission,
  formatEmission,
  getUnitLabel,
} from "../src/utils/unit-conversion";
import Preloader from "./Preloader";

const TREND_FALLBACK = [
  { day: "Mon", valueKgHr: 0 },
  { day: "Tue", valueKgHr: 0 },
  { day: "Wed", valueKgHr: 0 },
  { day: "Thu", valueKgHr: 0 },
  { day: "Fri", valueKgHr: 0 },
  { day: "Sat", valueKgHr: 0 },
  { day: "Sun", valueKgHr: 0 },
];

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

  const topFiveAlerts = useMemo(() => {
    const list = data?.recentAlerts ?? [];
    return [...list]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [data?.recentAlerts]);

  const hasLiveTrend = (data?.dailyTrend ?? []).length > 0;

  const trendData = useMemo(() => {
    if (hasLiveTrend) {
      return (data!.dailyTrend as { day: string; totalRate: number }[]).map((d) => ({
        day: d.day,
        value: convertEmission(d.totalRate, emissionUnit),
      }));
    }
    return TREND_FALLBACK.map((d) => ({
      day: d.day,
      value: convertEmission(d.valueKgHr, emissionUnit),
    }));
  }, [emissionUnit, hasLiveTrend, data?.dailyTrend]);

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
        <div className={`border-b px-5 py-4 ${cardSectionBorder}`}>
          <h2 className={`text-lg font-semibold ${sectionTitle}`}>
            Emission trend (7 days)
          </h2>
          <p className={`mt-1 text-sm ${muted}`}>
            {hasLiveTrend
              ? `Alert emission rates aggregated daily (${getUnitLabel(emissionUnit)})`
              : `No alert data yet — chart will populate as emissions are detected (${getUnitLabel(emissionUnit)})`}
          </p>
        </div>
        <div className={`h-72 p-4 ${innerMutedBg}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dashAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartStroke} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={chartStroke} stopOpacity={0} />
                </linearGradient>
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
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartStroke}
                strokeWidth={2}
                fill="url(#dashAreaFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
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
