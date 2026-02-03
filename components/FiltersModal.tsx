
import React from 'react';
import { X, ChevronDown, Calendar } from 'lucide-react';

interface FiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    darkMode?: boolean;
}

const FiltersModal: React.FC<FiltersModalProps> = ({ isOpen, onClose, darkMode }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-gray-900/20" onClick={onClose} />
            <div className={`relative w-[450px] h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300 transition-colors ${darkMode ? 'bg-[#12161f]' : 'bg-white'
                }`}>
                <div className={`p-8 border-b flex justify-between items-center ${darkMode ? 'border-[#1e2430]' : 'border-gray-100'}`}>
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Filter</h2>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8 flex-1">
                    {/* Date Range */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Date Range</h3>
                            <ChevronDown size={20} className="text-gray-400" />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Start Date"
                                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-teal-500 transition-all ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-700' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                        }`}
                                />
                                <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="End Date"
                                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-teal-500 transition-all ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-700' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                        }`}
                                />
                                <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                    </section>

                    {/* Sector */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sector</h3>
                            <ChevronDown size={20} className="text-gray-400" />
                        </div>
                        <div className="space-y-3">
                            {['All Sectors', 'Oil and Gas', 'Coal Mining', 'Waste Management', 'Agriculture', 'Other'].map(sector => (
                                <label key={sector} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border transition-all ${sector === 'All Sectors'
                                            ? darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-200'
                                            : darkMode ? 'bg-transparent border-[#2d364a]' : 'border-gray-300'
                                        } group-hover:border-teal-500`} />
                                    <span className={`text-sm font-medium transition-colors ${darkMode ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-700'}`}>{sector}</span>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* Instrument */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Instrument</h3>
                            <ChevronDown size={20} className="text-gray-400" />
                        </div>
                        <div className="space-y-3">
                            {['All', 'NASA EMIT', 'EMU', 'NASA AVIRIS-NG', 'NASA AVIRIS-3', 'ASU GAO'].map(inst => (
                                <label key={inst} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border transition-all ${darkMode ? 'bg-transparent border-[#2d364a]' : 'border-gray-300'} group-hover:border-teal-500`} />
                                    <span className={`text-sm font-medium transition-colors ${darkMode ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-700'}`}>{inst}</span>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* Gas Type */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Gas Type</h3>
                            <ChevronDown size={20} className="text-gray-400" />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className="w-5 h-5 rounded bg-teal-600 flex items-center justify-center">
                                <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 mb-0.5" />
                            </div>
                            <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>CH4</span>
                        </label>
                    </section>

                    {/* Emission Unit */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Emission Unit</h3>
                            <ChevronDown size={20} className="text-gray-400" />
                        </div>
                        <div className="relative">
                            <div className={`w-full border rounded-xl px-4 py-3 text-sm font-medium flex justify-between items-center transition-all ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-gray-200' : 'bg-white border-gray-200 text-gray-700'
                                }`}>
                                Kg/hr
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </section>

                    {/* Range Sliders */}
                    {[
                        { label: 'Source Emission Rate', min: 0, max: 20800, current: '0-12500' },
                        { label: 'Number of Plumes', min: 0, max: 480, current: '0-330' },
                        { label: 'Source Persistence', min: '0%', max: '100%', current: '0-76%' }
                    ].map(slider => (
                        <section key={slider.label} className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{slider.label}</h3>
                                <ChevronDown size={20} className="text-gray-400" />
                            </div>
                            <div className="relative pt-6 px-2">
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                                    {slider.current}
                                </div>
                                <div className={`h-1.5 w-full rounded-full relative transition-colors ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                    <div className="absolute h-full bg-teal-600 rounded-full" style={{ left: '0%', right: '25%' }} />
                                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-teal-600 rounded-full shadow-md" style={{ left: '75%' }} />
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tight">
                                    <span>{slider.min}</span>
                                    <span>{slider.max}</span>
                                </div>
                            </div>
                        </section>
                    ))}
                </div>

                <div className={`p-8 border-t flex gap-4 transition-colors ${darkMode ? 'border-[#1e2430]' : 'border-gray-100'}`}>
                    <button className={`flex-1 border rounded-2xl py-4 font-bold transition-all ${darkMode ? 'border-[#1e2430] text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-900 hover:bg-gray-50'
                        }`}>Reset</button>
                    <button onClick={onClose} className="flex-1 bg-teal-600 text-white rounded-2xl py-4 font-bold hover:bg-teal-700 shadow-xl shadow-teal-600/20">Done</button>
                </div>
            </div>
        </div>
    );
};

export default FiltersModal;
