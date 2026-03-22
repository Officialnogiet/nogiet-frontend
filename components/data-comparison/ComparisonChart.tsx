import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataPoint {
  month: string;
  value: number;
  distanceKm?: number;
  name?: string;
}

interface ComparisonChartProps {
  darkMode: boolean;
  hasData: boolean;
  isLoading: boolean;
  satelliteData: DataPoint[];
  groundData: DataPoint[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function bucketByMonth(data: DataPoint[]): Record<string, number> {
  const buckets: Record<string, { sum: number; count: number }> = {};
  MONTHS.forEach(m => { buckets[m] = { sum: 0, count: 0 }; });

  data.forEach((d) => {
    const month = MONTHS.includes(d.month) ? d.month : null;
    if (month) {
      buckets[month].sum += d.value;
      buckets[month].count += 1;
    }
  });

  const result: Record<string, number> = {};
  MONTHS.forEach(m => {
    result[m] = buckets[m].count > 0 ? Math.round(buckets[m].sum / buckets[m].count) : 0;
  });
  return result;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ darkMode, hasData, isLoading, satelliteData, groundData }) => {
  const satBuckets = bucketByMonth(satelliteData);
  const gndBuckets = bucketByMonth(groundData);

  const chartData = MONTHS.map(month => ({
    month,
    satellite: satBuckets[month],
    ground: gndBuckets[month],
  }));

  const hasSatellite = satelliteData.length > 0;
  const hasGround = groundData.length > 0;

  const satAvg = satelliteData.length > 0
    ? (satelliteData.reduce((s, d) => s + d.value, 0) / satelliteData.length).toFixed(1)
    : '0';
  const gndAvg = groundData.length > 0
    ? (groundData.reduce((s, d) => s + d.value, 0) / groundData.length).toFixed(1)
    : '0';

  return (
    <div className="flex-1">
      <div className={`rounded-2xl shadow-sm px-4 pt-6 pb-4 flex flex-col border transition-colors duration-300 ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
        <h3 className={`font-extrabold text-sm mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Emission Levels Comparison</h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
          </div>
        ) : hasData ? (
          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard darkMode={darkMode} label="Satellite Avg" value={`${satAvg} kg/hr`} color="#4dd0e1" count={satelliteData.length} subtitle="CarbonMapper sources" />
              <StatCard darkMode={darkMode} label="Ground Avg" value={`${gndAvg} kg/hr`} color={darkMode ? '#009688' : '#002b28'} count={groundData.length} subtitle="measurements" />
            </div>

            {(hasSatellite || hasGround) && chartData.some(d => d.satellite > 0 || d.ground > 0) ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={2}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={darkMode ? '#1e2430' : '#f0f0f0'} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} unit=" kg" />
                    <Tooltip
                      contentStyle={{ backgroundColor: darkMode ? '#111827' : '#fff', border: 'none', borderRadius: '12px', padding: '12px 16px', color: darkMode ? '#fff' : '#111' }}
                      formatter={(val: number, name: string) => [`${val} kg/hr`, name === 'satellite' ? 'Satellite (CarbonMapper)' : 'Ground Measurement']}
                    />
                    <Legend formatter={(val) => val === 'satellite' ? 'Satellite' : 'Ground'} />
                    <Bar dataKey="satellite" fill="#4dd0e1" radius={[6, 6, 0, 0]} barSize={14} />
                    <Bar dataKey="ground" fill={darkMode ? '#009688' : '#002b28'} radius={[6, 6, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <SatelliteTable darkMode={darkMode} data={satelliteData} groundData={groundData} />
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${darkMode ? 'bg-[#0b0e14]' : 'bg-gray-50'}`}>
              <svg className={`w-10 h-10 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div className="space-y-1">
              <h4 className={`font-extrabold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>No Data Selected</h4>
              <p className={`text-xs font-medium max-w-xs mx-auto ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Select a facility to compare ground measurements against satellite data.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ darkMode: boolean; label: string; value: string; color: string; count: number; subtitle: string }> = ({ darkMode, label, value, color, count, subtitle }) => (
  <div className={`rounded-xl p-4 border ${darkMode ? 'bg-[#0b0e14] border-[#1e2430]' : 'bg-gray-50 border-gray-100'}`}>
    <div className="flex items-center gap-2 mb-1">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</span>
    </div>
    <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{count} {subtitle}</p>
  </div>
);

const SatelliteTable: React.FC<{ darkMode: boolean; data: DataPoint[]; groundData: DataPoint[] }> = ({ darkMode, data, groundData }) => (
  <div className="flex-1 overflow-y-auto">
    {data.length > 0 && (
      <div className="mb-6">
        <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Satellite readings ({data.length})</p>
        <div className="space-y-2">
          {data.map((d, i) => (
            <div key={i} className={`flex justify-between items-center px-4 py-2.5 rounded-xl ${darkMode ? 'bg-[#0b0e14]' : 'bg-gray-50'}`}>
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{d.name || (d.month !== 'N/A' ? d.month : `Source ${i + 1}`)}</span>
                {d.distanceKm != null && (
                  <span className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{d.distanceKm} km from facility</span>
                )}
              </div>
              <span className={`text-sm font-bold ${darkMode ? 'text-[#4dd0e1]' : 'text-cyan-700'}`}>{d.value.toFixed(1)} kg/hr</span>
            </div>
          ))}
        </div>
      </div>
    )}
    {groundData.length > 0 && (
      <div>
        <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Ground readings ({groundData.length})</p>
        <div className="space-y-2">
          {groundData.map((d, i) => (
            <div key={i} className={`flex justify-between items-center px-4 py-2.5 rounded-xl ${darkMode ? 'bg-[#0b0e14]' : 'bg-gray-50'}`}>
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{d.month}</span>
              <span className={`text-sm font-bold ${darkMode ? 'text-[#009688]' : 'text-teal-700'}`}>{d.value.toFixed(1)} kg/hr</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default ComparisonChart;
