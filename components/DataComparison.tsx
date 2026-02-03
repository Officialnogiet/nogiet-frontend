
import React, { useState } from 'react';

const DataComparison: React.FC = () => {
  const [hasData, setHasData] = useState(false);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const satelliteData = [1500, 2500, 1800, 1000, 800, 1600, 2600, 2100, 2000, 2300, 1900, 1700];
  const groundData = [800, 1300, 900, 700, 500, 1000, 1400, 1100, 1000, 1200, 1000, 900];

  return (
    <div className="flex-1 bg-white overflow-y-auto p-12">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Data Comparison</h1>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white border border-gray-100 text-gray-800 rounded-2xl font-extrabold text-sm hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filter
          </button>
          <button className="px-6 py-3 bg-[#009688] text-white rounded-2xl font-extrabold text-sm hover:bg-[#00796b] flex items-center gap-2 shadow-xl shadow-[#009688]/20 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Input Form Card */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-white border border-gray-50 rounded-[32px] shadow-sm p-10 space-y-8">
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg">Input Ground Data</h3>
              <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-tight">Manually enter facility measurements.</p>
            </div>

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setHasData(true); }}>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Facility</label>
                <select className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-[#f9faf9] text-sm font-bold text-gray-400 focus:text-gray-900 focus:ring-1 focus:ring-[#009688] outline-none appearance-none cursor-pointer">
                  <option>Select facility</option>
                  <option>Delta Hub Alpha</option>
                  <option>Bonny Terminal</option>
                  <option>Escravos Pipeline Node</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Measurement Date</label>
                <div className="relative">
                  <input type="text" placeholder="Pick a date" className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-[#f9faf9] text-sm font-bold placeholder-gray-400 focus:ring-1 focus:ring-[#009688] outline-none" />
                  <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Methane Reading (kg/hr)</label>
                <input type="text" placeholder="0.00" className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-[#f9faf9] text-sm font-bold placeholder-gray-400 focus:ring-1 focus:ring-[#009688] outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Methodology</label>
                <select className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-[#f9faf9] text-sm font-bold text-gray-400 focus:text-gray-900 focus:ring-1 focus:ring-[#009688] outline-none appearance-none cursor-pointer">
                  <option>Select method</option>
                  <option>OGI Camera</option>
                  <option>Sniffer Drone</option>
                  <option>Fixed Sensor</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-[#009688] text-white py-4 rounded-2xl font-extrabold hover:bg-[#00796b] transition-all shadow-xl shadow-[#009688]/20 mt-4 text-base tracking-tight">
                Submit Data
              </button>
            </form>
          </div>
        </div>

        {/* Chart Card */}
        <div className="flex-1">
          <div className="bg-white border border-gray-50 rounded-[32px] shadow-sm p-12 h-full min-h-[560px] flex flex-col">
            <h3 className="font-extrabold text-gray-900 text-lg mb-10">Emission Levels Comparison</h3>
            
            {hasData ? (
              <div className="flex-1 flex flex-col">
                <div className="flex gap-8 mb-16">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#4dd0e1]"></div><span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Satellite</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#002b28]"></div><span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Ground Data</span></div>
                </div>

                <div className="flex-1 flex items-end justify-between relative pt-10 pb-10 border-b border-gray-50">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 h-full flex flex-col-reverse justify-between text-[11px] font-extrabold text-gray-300 pb-10 -ml-12">
                    <span>0kg</span><span>500kg</span><span>1000kg</span><span>1500kg</span><span>2000kg</span><span>2500kg</span><span>3000kg</span>
                  </div>

                  {months.map((month, i) => (
                    <div key={month} className="flex-1 flex flex-col items-center gap-4 group cursor-pointer">
                      <div className="flex items-end gap-1 w-full justify-center relative h-[320px]">
                        {/* Example Tooltip for June */}
                        {month === 'Jun' && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 bg-[#111] text-white p-4 rounded-2xl text-[11px] z-10 w-40 shadow-3xl">
                            <p className="font-extrabold mb-2 text-gray-400">June 2026</p>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#4dd0e1]"></div>Satellite: <span className="font-extrabold text-white">1000kg/hr</span></div>
                            <div className="flex items-center gap-2 mt-1"><div className="w-2 h-2 rounded-full bg-[#002b28]"></div>Ground: <span className="font-extrabold text-white">2000kg/hr</span></div>
                          </div>
                        )}
                        <div className="w-3 bg-[#4dd0e1] rounded-t-lg transition-all group-hover:opacity-80 group-hover:translate-y-[-4px]" style={{ height: `${(satelliteData[i]/3000)*100}%` }}></div>
                        <div className="w-3 bg-[#002b28] rounded-t-lg transition-all group-hover:opacity-80 group-hover:translate-y-[-4px]" style={{ height: `${(groundData[i]/3000)*100}%` }}></div>
                      </div>
                      <span className={`text-[12px] font-extrabold transition-colors ${month === 'Jun' ? 'text-gray-900' : 'text-gray-300'}`}>{month}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                <div className="w-64 h-64 bg-gray-50 rounded-full flex items-center justify-center">
                  <img src="https://img.icons8.com/isometric/512/empty-box.png" alt="No data" className="w-40 h-40 opacity-40 contrast-75" />
                </div>
                <div className="space-y-3">
                  <h4 className="font-extrabold text-gray-900 text-2xl tracking-tight">No Data Selected</h4>
                  <p className="text-sm text-gray-400 font-bold max-w-xs mx-auto leading-relaxed">Select a facility and input ground measurements to generate a comparison report against satellite data.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataComparison;
