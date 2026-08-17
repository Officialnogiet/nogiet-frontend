import React, { useState } from "react";
import { RadioTower, X } from "lucide-react";
import ImeoFeedSettings from "./settings/ImeoFeedSettings";
import type { DataFeedProvider } from "../src/api/imeo-feed.api";

const tabs: { id: DataFeedProvider; label: string }[] = [
  { id: "imeo", label: "IMEO" }, { id: "carbon_mapper", label: "Carbon Mapper" },
  { id: "tropomi", label: "TROPOMI" }, { id: "emit", label: "EMIT" },
];
export default function DataFeedsPage({ darkMode, onClose }: { darkMode: boolean; onClose?: () => void }) {
  const [provider, setProvider] = useState<DataFeedProvider>("imeo");
  return <div className={`flex-1 overflow-y-auto p-5 sm:p-7 lg:p-10 ${darkMode ? "bg-[#0b0e14]" : "bg-slate-50"}`}><div className="max-w-5xl mx-auto">
    <div className="flex items-center gap-4 mb-8"><div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#009688]/10 ring-1 ring-inset ring-teal-500/10 flex items-center justify-center"><RadioTower className="text-[#2dd4bf]"/></div><div className="flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2dd4bf]">Administration</p><h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>Data Feeds</h1><p className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>Manage source uploads, API connections, and expiry reminders.</p></div>{onClose && <button aria-label="Close data feeds" className={`p-2 rounded-xl ${darkMode ? "hover:bg-white/5" : "hover:bg-slate-100"}`} onClick={onClose}><X className="text-gray-500"/></button>}</div>
    <div className={`rounded-2xl border overflow-hidden shadow-xl ${darkMode ? "bg-[#111722] border-white/[0.07] shadow-black/10" : "bg-white border-slate-200/80 shadow-slate-200/60"}`}><div className={`flex overflow-x-auto p-2 gap-1 border-b ${darkMode ? "border-white/[0.07] bg-[#0e141e]" : "border-slate-100 bg-slate-50"}`}>{tabs.map((tab) => <button key={tab.id} onClick={() => setProvider(tab.id)} className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap ${provider === tab.id ? "bg-[#0d9488] text-white shadow-md" : darkMode ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-white"}`}>{tab.label}</button>)}</div><div className="p-5 md:p-8"><ImeoFeedSettings key={provider} darkMode={darkMode} provider={provider}/></div></div>
  </div></div>;
}
