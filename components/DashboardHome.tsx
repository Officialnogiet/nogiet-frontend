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
} from "lucide-react";
import { useDashboardSummary } from "../src/hooks/useEmissions";
import { useSettingsStore } from "../src/stores/settings.store";
import {
  convertEmission,
  formatEmission,
  getUnitLabel,
} from "../src/utils/unit-conversion";

const TREND_PLACEHOLDER_KG_HR = [
  { day: "Mon", valueKgHr: 42 },
  { day: "Tue", valueKgHr: 38 },
  { day: "Wed", valueKgHr: 55 },
  { day: "Thu", valueKgHr: 48 },
  { day: "Fri", valueKgHr: 62 },
  { day: "Sat", valueKgHr: 51 },
  { day: "Sun", valueKgHr: 58 },
];

interface DashboardHomeProps {
  darkMode: boolean;
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

const DashboardHome: React.FC<DashboardHomeProps> = ({ darkMode }) => {
  const dm = darkMode;
  const { data, isLoading, isError, error } = useDashboardSummary();
  const emissionUnit = useSettingsStore((s) => s.emissionUnit);

  const topFiveAlerts = useMemo(() => {
    const list = data?.recentAlerts ?? [];
    return [...list]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [data?.recentAlerts]);

  const trendData = useMemo(
    () =>
      TREND_PLACEHOLDER_KG_HR.map((d) => ({
        day: d.day,
        value: convertEmission(d.valueKgHr, emissionUnit),
      })),
    [emissionUnit],
  );

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
        className={`flex min-h-[320px] items-center justify-center rounded-xl border p-8 ${
          dm
            ? "border-[#1e2430] bg-[#12161f] text-slate-300"
            : "border-gray-200 bg-gray-50 text-gray-600"
        }`}
      >
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
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
    },
    {
      label: "Active Satellite Sources",
      value: summary.activeSatelliteSources.toLocaleString(),
      icon: Satellite,
    },
    {
      label: "Total Emission Rate",
      value: emissionDisplay,
      icon: Flame,
    },
    {
      label: "Alerts This Week",
      value: summary.alertsThisWeek.toLocaleString(),
      icon: Bell,
    },
  ];

  return (
    <div
      className={`space-y-6 p-4 sm:p-6 ${
        dm ? "bg-[#12161f] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon }) => (
          <div key={label} className={`${cardBase} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-medium ${muted}`}>{label}</p>
                <p
                  className={`mt-2 text-2xl font-semibold tracking-tight ${sectionTitle}`}
                >
                  {value}
                </p>
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
            Emission trend (sample)
          </h2>
          <p className={`mt-1 text-sm ${muted}`}>
            Placeholder time series ({getUnitLabel(emissionUnit)}) until live data
            is available.
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
                  summary.topFacilities.map((row) => (
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
    </div>
  );
};

export default DashboardHome;
