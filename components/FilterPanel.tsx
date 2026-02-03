
import React from 'react';

interface FilterPanelProps {
  onClose: () => void;
  darkMode?: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onClose, darkMode = true }) => {
  return (
    <div className={`absolute inset-y-0 right-0 w-[440px] transform transition-all duration-300 ease-in-out z-50 flex flex-col border-l shadow-2xl ${darkMode ? 'bg-[#12161f] border-[#1e2430] text-white' : 'bg-white border-gray-100 text-gray-900'
      }`}>
      <div className={`p-8 border-b flex items-center justify-between ${darkMode ? 'border-[#1e2430]' : 'border-gray-50'}`}>
        <h2 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Filter</h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-[#1e2430] text-gray-400 border-[#1e2430]' : 'hover:bg-gray-50 text-gray-300 border-gray-100'
            } border`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-10 py-6 space-y-1">
        {/* Accordion List */}
        {[
          {
            label: 'Date Range', open: true, content: (
              <div className="flex gap-4 py-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Start Date"
                    className={`w-full pl-5 pr-11 py-3 text-xs font-bold rounded-2xl outline-none transition-all ${darkMode ? 'bg-[#1a1f2b] border-[#2d364a] text-white placeholder-gray-500' : 'bg-[#f9faf9] border-gray-100 text-gray-900 placeholder-gray-400'
                      } border`}
                  />
                  <svg className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="End Date"
                    className={`w-full pl-5 pr-11 py-3 text-xs font-bold rounded-2xl outline-none transition-all ${darkMode ? 'bg-[#1a1f2b] border-[#2d364a] text-white placeholder-gray-500' : 'bg-[#f9faf9] border-gray-100 text-gray-900 placeholder-gray-400'
                      } border`}
                  />
                  <svg className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              </div>
            )
          },
          {
            label: 'Sector', open: true, content: (
              <div className="space-y-4 py-4 pl-1">
                {['All Sectors', 'Oil and Gas', 'Coal Mining', 'Waste Management', 'Agriculture', 'Other'].map((sector, i) => (
                  <label key={sector} className="flex items-center gap-3 group cursor-pointer">
                    <div className={`w-5 h-5 border-2 rounded-md transition-all relative ${i === 0
                      ? (darkMode ? 'bg-[#009688]/20 border-[#009688]' : 'bg-gray-100 border-gray-200')
                      : (darkMode ? 'bg-[#1a1f2b] border-[#2d364a]' : 'bg-white border-gray-100')
                      }`}>
                      {i === 0 && <div className={`absolute inset-1 rounded-sm ${darkMode ? 'bg-[#009688]' : 'bg-gray-400/20'}`}></div>}
                    </div>
                    <span className={`text-[13px] font-bold transition-colors ${darkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'
                      }`}>{sector}</span>
                  </label>
                ))}
              </div>
            )
          },
          {
            label: 'Instrument', open: true, content: (
              <div className="space-y-4 py-4 pl-1">
                {['All', 'NASA EMIT', 'EMU', 'NASA AVIRIS-NG', 'NASA AVIRIS-3', 'ASU GAO'].map((inst, i) => (
                  <label key={inst} className="flex items-center gap-3 group cursor-pointer">
                    <div className={`w-5 h-5 border-2 rounded-md transition-all relative ${darkMode ? 'bg-[#1a1f2b] border-[#2d364a]' : 'bg-white border-gray-100'
                      }`}></div>
                    <span className={`text-[13px] font-bold transition-colors ${darkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'
                      }`}>{inst}</span>
                  </label>
                ))}
              </div>
            )
          },
          {
            label: 'Gas Type', open: true, content: (
              <div className="py-4 pl-1">
                <label className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-5 h-5 bg-[#009688] border-2 border-[#009688] rounded-md flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <span className={`text-[13px] font-bold transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>CH4</span>
                </label>
              </div>
            )
          },
          {
            label: 'Emission Unit', open: true, content: (
              <div className="py-4">
                <div className="relative">
                  <select className={`w-full pl-5 pr-11 py-3 text-sm font-bold rounded-2xl outline-none appearance-none border transition-all ${darkMode ? 'bg-[#1a1f2b] border-[#2d364a] text-white' : 'bg-[#f9faf9] border-gray-100 text-gray-900'
                    }`}>
                    <option>Kg/hr</option>
                    <option>Mscf/d</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col -gap-1 pointer-events-none">
                    <svg className={`w-3 h-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg>
                    <svg className={`w-3 h-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            )
          },
          {
            label: 'Source Emission Rate', open: true, content: (
              <div className="pt-10 pb-4 relative px-2">
                <div className="absolute -top-1 left-[60%] -translate-x-1/2 bg-[#009688] text-white px-3 py-1.5 rounded-lg text-[11px] font-extrabold shadow-lg shadow-[#009688]/20 whitespace-nowrap">0-12500</div>
                <div className={`h-2 rounded-full w-full relative ${darkMode ? 'bg-[#1a1f2b]' : 'bg-gray-100'}`}>
                  <div className="absolute left-0 right-[35%] h-full bg-[#009688] rounded-full"></div>
                  <div className={`absolute left-[65%] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-lg border-4 border-[#009688] ${darkMode ? 'bg-[#12161f]' : 'bg-white'}`}></div>
                </div>
                <div className={`flex justify-between mt-3 text-[11px] font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}><span>0</span><span>20800</span></div>
              </div>
            )
          },
          {
            label: 'Number of Plumes', open: true, content: (
              <div className="pt-10 pb-4 relative px-2">
                <div className="absolute -top-1 left-[60%] -translate-x-1/2 bg-[#009688] text-white px-3 py-1.5 rounded-lg text-[11px] font-extrabold shadow-lg shadow-[#009688]/20 whitespace-nowrap">0-330</div>
                <div className={`h-2 rounded-full w-full relative ${darkMode ? 'bg-[#1a1f2b]' : 'bg-gray-100'}`}>
                  <div className="absolute left-0 right-[35%] h-full bg-[#009688] rounded-full"></div>
                  <div className={`absolute left-[65%] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-lg border-4 border-[#009688] ${darkMode ? 'bg-[#12161f]' : 'bg-white'}`}></div>
                </div>
                <div className={`flex justify-between mt-3 text-[11px] font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}><span>0</span><span>480</span></div>
              </div>
            )
          },
          {
            label: 'Source Persistence', open: true, content: (
              <div className="pt-10 pb-6 relative px-2">
                <div className="absolute -top-1 left-[60%] -translate-x-1/2 bg-[#009688] text-white px-3 py-1.5 rounded-lg text-[11px] font-extrabold shadow-lg shadow-[#009688]/20 whitespace-nowrap">0-76%</div>
                <div className={`h-2 rounded-full w-full relative ${darkMode ? 'bg-[#1a1f2b]' : 'bg-gray-100'}`}>
                  <div className="absolute left-0 right-[35%] h-full bg-[#009688] rounded-full"></div>
                  <div className={`absolute left-[65%] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-lg border-4 border-[#009688] ${darkMode ? 'bg-[#12161f]' : 'bg-white'}`}></div>
                </div>
                <div className={`flex justify-between mt-3 text-[11px] font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}><span>0%</span><span>100%</span></div>
              </div>
            )
          },
        ].map((item, idx) => (
          <div key={idx} className={`border-b last:border-none py-4 ${darkMode ? 'border-[#1e2430]' : 'border-gray-50'}`}>
            <button className={`w-full flex items-center justify-between text-base font-extrabold transition-colors ${darkMode ? 'text-gray-200 hover:text-[#009688]' : 'text-gray-800 hover:text-[#009688]'
              }`}>
              {item.label}
              <svg className={`w-5 h-5 transition-transform ${item.open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {item.open && item.content && <div className="animate-in fade-in slide-in-from-top-1 duration-200">{item.content}</div>}
          </div>
        ))}
      </div>

      <div className={`p-8 border-t flex gap-4 ${darkMode ? 'border-[#1e2430]' : 'border-gray-50'}`}>
        <button className={`flex-1 py-4 font-extrabold rounded-2xl transition-all text-sm border ${darkMode ? 'border-[#2d364a] text-gray-300 hover:bg-[#1e2430]' : 'border-gray-100 text-gray-800 hover:bg-gray-50'
          }`}>Reset</button>
        <button onClick={onClose} className="flex-1 py-4 bg-[#009688] text-white font-extrabold rounded-2xl hover:bg-[#00796b] transition-all text-sm shadow-xl shadow-[#009688]/20">Done</button>
      </div>
    </div>
  );
};

export default FilterPanel;
