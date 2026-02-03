
import React, { useState } from 'react';

interface LiveMapProps {
  onOpenFilters: () => void;
}

const LiveMap: React.FC<LiveMapProps> = ({ onOpenFilters }) => {
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const plumes = [
    { id: 1, name: 'Birnin Kebbi', top: '10%', left: '26%', size: 'w-4 h-4' },
    { id: 2, name: 'Gusau', top: '13%', left: '42%', size: 'w-4 h-4' },
    { id: 3, name: 'Kano', top: '15%', left: '55%', size: 'w-14 h-14' },
    { id: 4, name: 'Kaduna', top: '33%', left: '48%', size: 'w-14 h-14' },
    { id: 5, name: 'Minna', top: '44%', left: '42%', size: 'w-12 h-12' },
    { id: 6, name: 'Abuja', top: '50%', left: '49%', size: 'w-16 h-16' },
    { id: 7, name: 'Lafia', top: '55%', left: '56%', size: 'w-12 h-12' },
    { id: 8, name: 'Makurdi', top: '65%', left: '56%', size: 'w-14 h-14' },
    { id: 9, name: 'Enugu', top: '78%', left: '49%', size: 'w-14 h-14' },
    { id: 10, name: 'Ilorin', top: '55%', left: '28%', size: 'w-14 h-14' },
    { id: 11, name: 'Oyo', top: '63%', left: '24%', size: 'w-12 h-12' },
    { id: 12, name: 'Ibadan', top: '68%', left: '24%', size: 'w-16 h-16' },
    { id: 13, name: 'Ado Ekiti', top: '65%', left: '33%', size: 'w-14 h-14' },
    { id: 14, name: 'Onitsha', top: '82%', left: '44%', size: 'w-14 h-14' },
    { id: 15, name: 'Port Harcourt', top: '92%', left: '46%', size: 'w-16 h-16' },
  ];

  const handleOpenDetail = (p: any) => {
    setSelectedFacility(p);
    setShowDetailModal(true);
  };

  return (
    <div className="flex-1 relative bg-white overflow-hidden">
      {/* Search Header Overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[92%] z-20">
        <div className="bg-[#002b28] rounded-2xl p-3 flex items-center justify-between shadow-2xl">
          <div className="flex-1 max-w-lg relative ml-2">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search facility, pipeline or coordinates"
              className="w-full bg-[#001f1d] border-none rounded-xl py-2.5 pl-11 pr-4 text-sm text-gray-400 focus:ring-1 focus:ring-[#009688] outline-none placeholder-gray-500"
            />
          </div>
          <button
            onClick={onOpenFilters}
            className="flex items-center gap-2 px-4 py-2.5 bg-transparent hover:bg-white/5 text-gray-300 rounded-xl transition-all mr-2 group"
          >
            <span className="text-sm font-bold">Choose Filters</span>
            <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
      </div>

      {/* Map Content */}
      <div className="absolute inset-0 grayscale contrast-75 bg-cover bg-center bg-[#f0f2f0]" style={{ backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/4/4e/Map_of_Nigeria.png')`, backgroundSize: '120% auto', backgroundPosition: 'center top' }}>
        {/* Plume Markers */}
        {plumes.map(plume => (
          <div
            key={plume.id}
            className={`absolute ${plume.size} -translate-x-1/2 -translate-y-1/2 group cursor-pointer`}
            style={{ top: plume.top, left: plume.left }}
            onClick={() => setSelectedFacility({ ...plume, name: `${plume.name} Node` })}
          >
            <div className="absolute inset-0 bg-[#009688] rounded-full blur-[16px] opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <div className="absolute inset-[30%] bg-[#009688] rounded-full opacity-60"></div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-gray-600 uppercase tracking-wider">{plume.name}</div>
          </div>
        ))}
      </div>

      {/* Map Grid Lines Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`, backgroundSize: '60px 60px' }}></div>

      {/* Alert Icon Button */}
      <button
        onClick={() => setIsAlertsOpen(!isAlertsOpen)}
        className="absolute top-28 left-8 w-11 h-11 bg-[#002b28] text-white flex items-center justify-center rounded-xl shadow-lg hover:bg-[#003d38] z-20"
      >
        <div className="relative">
          <svg className="w-5 h-5 text-[#009688]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#002b28]"></div>
        </div>
      </button>

      {/* Alerts Drawer */}
      {isAlertsOpen && (
        <div className="absolute top-28 left-20 w-[360px] bg-white rounded-2xl shadow-2xl p-6 z-30 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Recent Alerts
            </h3>
            <button onClick={() => setIsAlertsOpen(false)} className="text-gray-400 hover:text-gray-600 p-1"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-100 transition-colors cursor-pointer flex items-start gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="font-bold text-[13px] text-gray-900">Delta Facility A - High Output</p>
                  <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-tight">1250kg/hr • <span className="text-gray-300">3hrs ago</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats Card */}
      <div className="absolute bottom-10 left-8 w-64 bg-white rounded-[24px] shadow-2xl p-8 z-20 border border-gray-100/50">
        <button className="absolute right-5 top-5 text-gray-200 hover:text-gray-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
        <div className="space-y-8">
          <div>
            <p className="text-[14px] font-bold text-gray-800">Emission Sources</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Current View (CH4)</p>
            <p className="text-5xl font-extrabold text-gray-900 mt-2 tracking-tight">2.5k</p>
          </div>
          <div>
            <p className="text-[14px] font-bold text-gray-800">Plumes Detected</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Current View (CH4)</p>
            <p className="text-5xl font-extrabold text-gray-900 mt-2 tracking-tight">12.4k</p>
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-10 right-8 flex flex-col gap-3 z-20">
        <button className="w-11 h-11 bg-[#009688] text-white rounded-xl shadow-xl flex items-center justify-center hover:bg-[#00796b] transition-colors"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6" /></svg></button>
        <button className="w-11 h-11 bg-[#009688] text-white rounded-xl shadow-xl flex items-center justify-center hover:bg-[#00796b] transition-colors"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg></button>
      </div>

      {/* Tooltip Popup */}
      {selectedFacility && !showDetailModal && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[120%] w-64 bg-white rounded-2xl shadow-2xl p-6 z-40 border border-gray-100">
          <div className="space-y-5">
            <div>
              <h4 className="font-extrabold text-gray-900">Escravos Pipeline Node</h4>
              <button className="text-[10px] font-bold text-[#009688] hover:underline uppercase tracking-tight mt-1">Show in Google Maps</button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Sector', value: 'Refinery' },
                { label: 'Gas type', value: 'CH4' },
                { label: 'Emission rate', value: '500 kg/hr', color: 'text-[#009688]' },
                { label: 'Source', value: 'CarbonMapper' },
              ].map((row, idx) => (
                <div key={idx} className="flex justify-between text-[11px] font-bold">
                  <span className="text-gray-400 uppercase tracking-tight">{row.label}</span>
                  <span className={row.color || 'text-gray-700'}>{row.value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowDetailModal(true)}
              className="w-full text-center text-[12px] font-extrabold text-[#009688] border-t border-gray-50 pt-4 hover:text-[#00796b] flex items-center justify-center gap-1 group"
            >
              View Details <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-100"></div>
        </div>
      )}

      {/* Detail Modal Overlay */}
      {showDetailModal && (
        <div className="absolute inset-0 bg-black/5 flex items-center justify-center z-[100] p-10 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 pb-0 flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Escravos Pipeline Node</h2>
                <button className="text-[12px] font-bold text-[#009688] hover:underline uppercase tracking-widest">Show in Google Maps</button>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="p-10 pt-8 flex-1 overflow-y-auto space-y-10">
              <div className="flex flex-col md:flex-row gap-12">
                <div className="space-y-2">
                  <p className="text-[64px] font-extrabold text-[#009688] leading-none tracking-tighter">2,450 <span className="text-[24px] font-bold text-gray-400 tracking-normal ml-1">kg/hr</span></p>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-4 pt-6 text-[12px] font-bold border-t border-gray-50">
                    <div><span className="text-gray-400 block mb-1 uppercase tracking-widest">Gas Type</span><span className="text-gray-900">CH4</span></div>
                    <div><span className="text-gray-400 block mb-1 uppercase tracking-widest">Source</span><span className="text-gray-900">CarbonMapper</span></div>
                    <div><span className="text-gray-400 block mb-1 uppercase tracking-widest">Source Persistence</span><span className="text-gray-900">13%</span></div>
                    <div><span className="text-gray-400 block mb-1 uppercase tracking-widest">Number of Plumes</span><span className="text-gray-900">1</span></div>
                    <div><span className="text-gray-400 block mb-1 uppercase tracking-widest">Instrument</span><span className="text-gray-900">NASA EMIT</span></div>
                  </div>
                </div>

                <div className="flex-1 bg-white border border-gray-100 rounded-3xl p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-gray-900 uppercase text-[12px] tracking-widest">Emission Rate</h4>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-[11px] font-bold text-gray-600 border border-gray-100">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Last 7 Days
                    </button>
                  </div>

                  <div className="h-64 flex items-end justify-between px-2 pt-10 relative">
                    {/* Simplified Chart */}
                    {[1800, 1500, 2400, 1400, 1400, 1100, 1300].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center group cursor-pointer h-full justify-end">
                        <div className={`w-8 bg-[#009688] rounded-t-lg transition-all group-hover:bg-[#00796b] relative`} style={{ height: `${(val / 3000) * 100}%` }}>
                          {idx === 2 && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-[#111] text-white p-3 rounded-xl text-[10px] z-10 w-32 shadow-2xl">
                              <p className="font-bold mb-1">12-01-2026</p>
                              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#009688]"></div>1,850 kg/hr</div>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-gray-300 mt-3 whitespace-nowrap">1{idx}-01-2026</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-gray-300 text-center uppercase tracking-widest">Data Source: CarbonMapper API v1 • L4A Product • Real data subject to 30-day latency</p>
                </div>
              </div>

              <div className="flex justify-end gap-4 border-t border-gray-50 pt-10">
                <button className="px-8 py-4 border border-gray-100 rounded-2xl text-gray-700 font-bold hover:bg-gray-50 flex items-center gap-2 transition-all shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Share
                </button>
                <button className="px-10 py-4 bg-[#009688] text-white rounded-2xl font-bold hover:bg-[#00796b] flex items-center gap-2 transition-all shadow-lg shadow-[#009688]/20">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMap;
