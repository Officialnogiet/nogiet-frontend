
import React from 'react';

interface FilterPanelProps {
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-y-0 right-0 w-[440px] bg-white shadow-[-30px_0_80px_rgba(0,0,0,0.06)] z-50 flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
      <div className="p-10 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Filter</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl text-gray-300 border border-gray-100 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>

      <div className="flex-1 overflow-y-auto px-10 py-6 space-y-1">
        {/* Accordion List */}
        {[
          { label: 'Date Range', open: true, content: (
            <div className="flex gap-4 py-4">
              <div className="flex-1 relative">
                <input type="text" placeholder="Start Date" className="w-full pl-5 pr-11 py-3 text-xs font-bold bg-[#f9faf9] border border-gray-100 rounded-2xl outline-none placeholder-gray-400" />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div className="flex-1 relative">
                <input type="text" placeholder="End Date" className="w-full pl-5 pr-11 py-3 text-xs font-bold bg-[#f9faf9] border border-gray-100 rounded-2xl outline-none placeholder-gray-400" />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            </div>
          )},
          { label: 'Sector', open: true, content: (
            <div className="space-y-4 py-4 pl-1">
              {['All Sectors', 'Oil and Gas', 'Coal Mining', 'Waste Management', 'Agriculture', 'Other'].map((sector, i) => (
                <label key={sector} className="flex items-center gap-3 group cursor-pointer">
                  <div className={`w-5 h-5 border-2 rounded-md transition-all relative ${i === 0 ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-100'}`}>
                    {i === 0 && <div className="absolute inset-1 bg-gray-400/20 rounded-sm"></div>}
                  </div>
                  <span className="text-[13px] font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{sector}</span>
                </label>
              ))}
            </div>
          )},
          { label: 'Instrument', open: true, content: (
            <div className="space-y-4 py-4 pl-1">
              {['All', 'NASA EMIT', 'EMU', 'NASA AVIRIS-NG', 'NASA AVIRIS-3', 'ASU GAO'].map((inst, i) => (
                <label key={inst} className="flex items-center gap-3 group cursor-pointer">
                  <div className={`w-5 h-5 border-2 rounded-md transition-all relative ${i === 0 ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-100'}`}></div>
                  <span className="text-[13px] font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{inst}</span>
                </label>
              ))}
            </div>
          )},
          { label: 'Gas Type', open: true, content: (
             <div className="py-4 pl-1">
                <label className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-5 h-5 bg-[#009688] border-2 border-[#009688] rounded-md flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <span className="text-[13px] font-bold text-gray-900 transition-colors">CH4</span>
                </label>
             </div>
          )},
          { label: 'Emission Unit', open: true, content: (
            <div className="py-4">
              <div className="relative">
                <select className="w-full pl-5 pr-11 py-3 text-sm font-bold bg-[#f9faf9] border border-gray-100 rounded-2xl outline-none appearance-none">
                  <option>Kg/hr</option>
                  <option>Mscf/d</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col -gap-1 pointer-events-none">
                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg>
                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          )},
          { label: 'Source Emission Rate', open: true, content: (
             <div className="pt-10 pb-4 relative px-2">
                <div className="absolute -top-1 left-[60%] -translate-x-1/2 bg-[#009688] text-white px-3 py-1.5 rounded-lg text-[11px] font-extrabold shadow-lg shadow-[#009688]/20 whitespace-nowrap">0-12500</div>
                <div className="h-2 bg-gray-100 rounded-full w-full relative">
                  <div className="absolute left-0 right-[35%] h-full bg-[#009688] rounded-full"></div>
                  <div className="absolute left-[65%] top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-4 border-[#009688] rounded-full shadow-lg"></div>
                </div>
                <div className="flex justify-between mt-3 text-[11px] font-bold text-gray-400"><span>0</span><span>20800</span></div>
             </div>
          )},
          { label: 'Number of Plumes', open: true, content: (
             <div className="pt-10 pb-4 relative px-2">
                <div className="absolute -top-1 left-[60%] -translate-x-1/2 bg-[#009688] text-white px-3 py-1.5 rounded-lg text-[11px] font-extrabold shadow-lg shadow-[#009688]/20 whitespace-nowrap">0-330</div>
                <div className="h-2 bg-gray-100 rounded-full w-full relative">
                  <div className="absolute left-0 right-[35%] h-full bg-[#009688] rounded-full"></div>
                  <div className="absolute left-[65%] top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-4 border-[#009688] rounded-full shadow-lg"></div>
                </div>
                <div className="flex justify-between mt-3 text-[11px] font-bold text-gray-400"><span>0</span><span>480</span></div>
             </div>
          )},
          { label: 'Source Persistence', open: true, content: (
             <div className="pt-10 pb-6 relative px-2">
                <div className="absolute -top-1 left-[60%] -translate-x-1/2 bg-[#009688] text-white px-3 py-1.5 rounded-lg text-[11px] font-extrabold shadow-lg shadow-[#009688]/20 whitespace-nowrap">0-76%</div>
                <div className="h-2 bg-gray-100 rounded-full w-full relative">
                  <div className="absolute left-0 right-[35%] h-full bg-[#009688] rounded-full"></div>
                  <div className="absolute left-[65%] top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-4 border-[#009688] rounded-full shadow-lg"></div>
                </div>
                <div className="flex justify-between mt-3 text-[11px] font-bold text-gray-400"><span>0%</span><span>100%</span></div>
             </div>
          )},
        ].map((item, idx) => (
          <div key={idx} className="border-b border-gray-50 last:border-none py-4">
            <button className="w-full flex items-center justify-between text-base font-extrabold text-gray-800 hover:text-[#009688] transition-colors">
              {item.label}
              <svg className={`w-5 h-5 transition-transform ${item.open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {item.open && item.content && <div className="animate-in fade-in slide-in-from-top-1 duration-200">{item.content}</div>}
          </div>
        ))}
      </div>

      <div className="p-10 border-t border-gray-100 flex gap-4">
        <button className="flex-1 py-4 border border-gray-100 text-gray-800 font-extrabold rounded-2xl hover:bg-gray-50 transition-all text-sm">Reset</button>
        <button onClick={onClose} className="flex-1 py-4 bg-[#009688] text-white font-extrabold rounded-2xl hover:bg-[#00796b] transition-all text-sm shadow-xl shadow-[#009688]/20">Done</button>
      </div>
    </div>
  );
};

export default FilterPanel;
