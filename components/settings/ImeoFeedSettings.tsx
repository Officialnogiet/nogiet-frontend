import React, { useCallback, useEffect, useState } from "react";
import { CloudDownload, Database, LockKeyhole, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { imeoFeedApi, type DataFeedPreview, type DataFeedProvider, type ImeoBatch, type ImeoFeedMode, type ImeoFeedStatus } from "../../src/api/imeo-feed.api";

const errorText = (error: unknown) => error instanceof Error ? error.message : "Request failed";
const providerName = (provider: DataFeedProvider) => provider === "imeo" ? "IMEO" : provider === "carbon_mapper" ? "Carbon Mapper" : provider.toUpperCase();

export default function ImeoFeedSettings({ darkMode, provider }: { darkMode: boolean; provider: DataFeedProvider }) {
  const [status, setStatus] = useState<ImeoFeedStatus | null>(null);
  const [history, setHistory] = useState<ImeoBatch[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<DataFeedPreview | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [month, setMonth] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [selectedMode, setSelectedMode] = useState<ImeoFeedMode>("api");
  const [apiVerified, setApiVerified] = useState(false);
  const [apiTestAttempted, setApiTestAttempted] = useState(false);
  const [showManualLock, setShowManualLock] = useState(false);
  const [showApiSwitch, setShowApiSwitch] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ImeoBatch | null>(null);
  const label = providerName(provider);
  const muted = darkMode ? "text-gray-400" : "text-gray-500";
  const input = darkMode ? "bg-[#0b0e14] border-[#273142] text-white" : "bg-white border-gray-200 text-gray-900";

  const reload = useCallback(async () => {
    const [s, h] = await Promise.all([imeoFeedApi.status(provider), imeoFeedApi.history(provider)]);
    setStatus(s); setHistory(h);
    return { status: s, history: h };
  }, [provider]);
  useEffect(() => {
    let active = true;
    setInitialLoading(true);
    setNotice(null); setApiVerified(false); setApiTestAttempted(false); setShowManualLock(false); setShowApiSwitch(false); setSelectedMode("api");
    reload().then(({ history: uploads }) => {
      if (!active) return;
      if (uploads.length > 0) {
        setApiTestAttempted(true);
        setSelectedMode("manual");
      }
    }).catch((e) => {
      if (active) setNotice({ ok: false, text: errorText(e) });
    }).finally(() => {
      if (active) setInitialLoading(false);
    });
    return () => { active = false; };
  }, [reload, provider]);
  const run = async (key: string, task: () => Promise<unknown>, message: string) => {
    setBusy(key); setNotice(null);
    try { await task(); await reload(); setNotice({ ok: true, text: message }); return true; }
    catch (e) { await reload().catch(() => undefined); setNotice({ ok: false, text: errorText(e) }); return false; }
    finally { setBusy(""); }
  };
  const testApi = async (promptToSwitch = false) => {
    setApiVerified(false);
    try {
      const result = await imeoFeedApi.testApi(provider);
      if (!result.success) throw new Error(result.message || `${label} API test failed`);
      setApiVerified(true);
      if (promptToSwitch) setShowApiSwitch(true);
      return result;
    } catch (error) {
      window.setTimeout(() => {
        setSelectedMode("manual");
        setShowManualLock(false);
      }, 1800);
      throw new Error(`${errorText(error)} Manual Upload will open shortly.`);
    } finally {
      // A completed attempt unlocks the manual fallback even when the live
      // provider is unavailable, unauthorized, or returns invalid data.
      setApiTestAttempted(true);
    }
  };

  const chooseMode = (mode: ImeoFeedMode) => {
    if (mode === "manual" && !apiTestAttempted) {
      setShowManualLock(true);
      return;
    }
    setSelectedMode(mode);
    if (mode === "api") setApiVerified(false);
    setNotice(null);
  };

  const inspectFile = async (candidate: File | null) => {
    setFile(candidate); setPreview(null); setNotice(null);
    if (!candidate) return;
    setPreviewBusy(true);
    try { setPreview(await imeoFeedApi.preview(provider, candidate)); }
    catch (error) { setNotice({ ok: false, text: errorText(error) }); }
    finally { setPreviewBusy(false); }
  };

  if (initialLoading) return <div className="space-y-7" aria-busy="true">
    <div className="flex gap-3"><Database className="text-[#009688]"/><div><h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{label} Data Feed</h2><p className={`text-xs ${muted}`}>Upload, API handover, and expiry control</p></div></div>
    <div className={`flex min-h-64 flex-col items-center justify-center rounded-2xl border ${darkMode ? "border-[#273142] bg-[#0e141e]" : "border-slate-200 bg-white"}`} role="status" aria-live="polite">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#009688]/10"><RefreshCw className="animate-spin text-[#009688]" size={22}/></div>
      <p className={`mt-4 text-sm font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>Checking saved uploads…</p>
      <p className={`mt-1 text-xs ${muted}`}>Opening the correct data source.</p>
    </div>
  </div>;

  return <div className="space-y-7">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex gap-3"><Database className="text-[#009688]"/><div><h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{label} Data Feed</h2><p className={`text-xs ${muted}`}>Upload, API handover, and expiry control</p></div></div>
      <div className={`inline-flex rounded-xl p-1 ${darkMode ? "bg-[#0b0e14]" : "bg-gray-100"}`}>
        {(["api", "manual"] as ImeoFeedMode[]).map((mode) => {
          const manualLocked = mode === "manual" && !apiTestAttempted;
          return <button key={mode} disabled={!!busy} aria-disabled={manualLocked} onClick={() => chooseMode(mode)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold ${selectedMode === mode ? "bg-[#009688] text-white" : muted} ${manualLocked ? "opacity-50 cursor-not-allowed" : ""}`}>{manualLocked && <LockKeyhole size={12}/>} {mode === "manual" ? "Manual Upload" : "API"}</button>;
        })}
      </div>
    </div>

    {status?.activeBatch && <div className={`rounded-2xl border p-4 ${darkMode ? "border-[#273142] bg-[#0b0e14]" : "border-gray-100 bg-gray-50"}`}>
      <p className="text-xs uppercase tracking-wider text-[#009688] font-bold">{status.mode === "manual" ? "Active manual dataset" : "Stored manual reference"}</p>
      <p className={`font-bold mt-2 ${darkMode ? "text-white" : "text-gray-900"}`}>{status.activeBatch.reportingMonth} · {status.activeBatch.recordCount.toLocaleString()} records</p>
      <p className={`text-xs mt-1 ${muted}`}>{status.activeBatch.filename} · renewal reminder {status.activeBatch.expiresAt ? new Date(status.activeBatch.expiresAt).toLocaleDateString() : "not set"}</p>
    </div>}

    {selectedMode === "manual" && <section className={`overflow-hidden rounded-2xl border ${darkMode ? "border-[#273142] bg-[#0e141e]" : "border-slate-200 bg-white"}`}>
      <header className={`flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between ${darkMode ? "border-white/[0.07] bg-teal-400/[0.04]" : "border-slate-100 bg-teal-50/50"}`}>
        <div><p className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{history.length ? "Upload a recent dataset" : "Add a manual dataset"}</p><p className={`mt-1 text-xs ${muted}`}>Previously uploaded records stay archived. Upload an update or check the live {label} API.</p></div>
        <button disabled={!!busy} onClick={() => run("test", () => testApi(true), `${label} API is available. Choose whether to switch sources.`)} className={`flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold ${darkMode ? "border-[#273142] bg-[#111722] text-gray-200 hover:bg-white/5" : "border-slate-200 bg-white text-slate-700 hover:border-teal-300"}`}><RefreshCw size={16} className={busy === "test" ? "animate-spin" : ""}/>Check live API</button>
      </header>
      <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_260px] md:p-5">
        <div className="space-y-3"><label className={`flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${darkMode ? "border-[#273142] bg-[#0b0e14]/50 hover:border-[#009688] hover:bg-teal-500/[0.03]" : "border-slate-200 bg-slate-50/60 hover:border-[#009688] hover:bg-teal-50/40"}`}><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#009688]/10">{previewBusy ? <RefreshCw className="animate-spin text-[#009688]" size={22}/> : <Upload className="text-[#009688]" size={22}/>}</div><span className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{previewBusy ? "Inspecting dataset…" : file?.name ?? `Choose ${label} file`}</span><span className={`mt-1 text-[10px] ${muted}`}>Official provider ZIP, CSV, GeoJSON or JSON</span><input className="hidden" type="file" accept=".zip,.csv,.json,.geojson" onChange={(e) => inspectFile(e.target.files?.[0] ?? null)}/></label>
        {notice && !notice.ok && file && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500" role="alert"><p className="font-bold">This file cannot be used</p><p className="mt-1 text-xs leading-relaxed">{notice.text}</p></div>}
        <div className={`flex flex-col gap-2 rounded-xl border px-3 py-3 sm:flex-row sm:items-center sm:justify-between ${darkMode ? "border-white/[0.07] bg-white/[0.02]" : "border-slate-200 bg-slate-50"}`}><div><p className={`text-xs font-bold ${darkMode ? "text-gray-200" : "text-slate-700"}`}>Need an example?</p><p className={`text-[10px] ${muted}`}>Download fake demonstration data showing the accepted fields.</p></div><div className="flex flex-wrap gap-1.5">{(["csv", "geojson", "json", "zip"] as const).map((format) => <button type="button" key={format} onClick={() => imeoFeedApi.downloadSample(provider, format).catch((error) => setNotice({ ok: false, text: errorText(error) }))} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase ${darkMode ? "border-white/10 text-gray-300 hover:border-teal-400/40" : "border-slate-200 bg-white text-slate-600 hover:border-teal-400"}`}><CloudDownload className="mr-1 inline" size={11}/>{format}</button>)}</div></div>
        {preview && <div className={`rounded-2xl border p-4 ${darkMode ? "border-emerald-400/15 bg-emerald-400/[0.04]" : "border-emerald-100 bg-emerald-50/60"}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>Dataset review</p><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-500">Ready to publish</span></div><div className={`mt-3 grid gap-2 text-xs sm:grid-cols-2 ${darkMode ? "text-gray-300" : "text-slate-700"}`}><p><span className={muted}>Nigeria records:</span> <strong>{preview.recordCount.toLocaleString()}</strong> of {preview.globalRecordCount.toLocaleString()}</p><p><span className={muted}>Coverage:</span> <strong>{preview.monthScope === "all_months" ? `All months (${preview.monthCount})` : "One month"}</strong></p><p><span className={muted}>Date range:</span> <strong>{preview.earliestMonth ?? "Unknown"} – {preview.latestMonth ?? "Unknown"}</strong></p><p><span className={muted}>Latest month:</span> <strong>{preview.latestMonth ?? "Upload month"}</strong></p><p className="sm:col-span-2"><span className={muted}>Proposed reminder:</span> <strong>{new Date(preview.reminderAt).toLocaleDateString()}</strong> · {preview.reminderBasis === "document" ? "found in document" : preview.reminderBasis === "latest_observation" ? "7 days after latest observation" : "7 days after upload"}</p></div><div className={`mt-3 grid grid-cols-2 gap-2 rounded-xl p-3 text-[10px] sm:grid-cols-4 ${darkMode ? "bg-black/20 text-gray-300" : "bg-white/70 text-slate-600"}`}><p><strong className="block text-sm text-emerald-500">{preview.addedCount.toLocaleString()}</strong>New records</p><p><strong className="block text-sm text-amber-500">{preview.updatedCount.toLocaleString()}</strong>Updated</p><p><strong className={`block text-sm ${darkMode ? "text-gray-200" : "text-slate-800"}`}>{preview.unchangedCount.toLocaleString()}</strong>Unchanged</p><p><strong className={`block text-sm ${darkMode ? "text-gray-200" : "text-slate-800"}`}>{preview.retainedCount.toLocaleString()}</strong>History retained</p></div><p className={`mt-2 text-xs font-bold ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>Publishing will activate {preview.finalRecordCount.toLocaleString()} total records. Newer overlapping records will replace their earlier versions.</p><p className={`mt-3 border-t pt-3 text-[10px] ${darkMode ? "border-white/[0.07] text-gray-400" : "border-emerald-100 text-slate-500"}`}>This is a preview only. The Live Map will not change until you select Publish &amp; Activate. The previous dataset and original file remain archived.</p></div>}
        </div>
        <div className={`rounded-2xl border p-4 ${darkMode ? "border-white/[0.07] bg-[#111722]" : "border-slate-200 bg-slate-50/70"}`}>
          <div><label className={`block text-xs font-bold ${muted}`}>Dataset month <span className="font-medium opacity-70">(optional)</span></label><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm ${input}`}/><p className={`mt-1.5 text-[10px] leading-snug ${muted}`}>Detected from the file when left blank.</p></div>
          <div className="mt-4"><label className={`block text-xs font-bold ${muted}`}>Renewal reminder <span className="font-medium opacity-70">(optional)</span></label><input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm ${input}`}/><p className={`mt-1.5 text-[10px] leading-snug ${muted}`}>Detected from the file or scheduled automatically.</p></div>
          <button disabled={!file || !preview || previewBusy || !!busy} onClick={() => file && run("upload", () => imeoFeedApi.upload(provider, file, month, expiresAt), `${label} manual dataset published and activated.`).then((ok) => { if (ok) { setFile(null); setPreview(null); } })} className="mt-5 w-full rounded-xl bg-[#009688] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#00796b] disabled:cursor-not-allowed disabled:opacity-40">{busy === "upload" ? "Publishing…" : "Publish & Activate"}</button>
        </div>
      </div>
    </section>}

    {selectedMode === "api" && <div className={`rounded-2xl border p-5 space-y-4 ${darkMode ? "border-[#273142]" : "border-gray-100"}`}><div><p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Activate API source</p><p className={`text-xs mt-1 ${muted}`}>Test the live API first, then explicitly confirm it as the map source. Manual files remain stored in history.</p>{status?.mode === "api" && <p className="text-xs mt-2 font-bold text-emerald-500">API mode is currently saved. Test and confirm again to refresh the live map source.</p>}</div><div className="flex flex-wrap items-center gap-3"><button disabled={!!busy} onClick={() => run("test", testApi, `${label} API test succeeded. You can now use it on the map.`)} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold ${darkMode ? "border-[#273142] text-gray-200" : "border-gray-200 text-gray-700"}`}><RefreshCw size={16} className={busy === "test" ? "animate-spin" : ""}/>Test API</button><button disabled={!apiVerified || !!busy} onClick={() => run("activate-api", () => imeoFeedApi.setMode(provider, "api"), `${label} API is now the active map source. Manual data remains stored as reference.`)} className="rounded-xl bg-[#009688] disabled:opacity-40 text-white px-5 py-2.5 text-sm font-bold">{busy === "activate-api" ? "Activating…" : "Use API on Map"}</button></div>{status?.lastApiTestMessage && <p className={`text-xs ${status.lastApiTestSuccess ? "text-emerald-500" : "text-amber-500"}`}>{status.lastApiTestMessage}</p>}</div>}
    {notice && (notice.ok || selectedMode !== "manual" || !file) && <div className={`rounded-xl px-4 py-3 text-sm ${notice.ok ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>{notice.text}</div>}

    <section><div className="mb-3 flex items-end justify-between gap-3"><div><h3 className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Upload archive</h3><p className={`mt-1 text-[10px] ${muted}`}>Business records and original files retained until explicitly deleted.</p></div><span className={`text-[10px] font-bold ${muted}`}>{history.length} file{history.length === 1 ? "" : "s"}</span></div><div className="space-y-2 max-h-80 overflow-y-auto">{history.map((batch) => { const activeManual = batch.id === status?.activeBatch?.id && status?.mode === "manual"; return <div key={batch.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 ${darkMode ? "border-[#273142]" : "border-gray-100"}`}><div><p className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{batch.reportingMonth} {activeManual ? <span className="ml-2 text-[10px] text-[#009688]">ACTIVE</span> : <span className={`ml-2 text-[9px] font-bold uppercase ${muted}`}>Archived</span>}</p><p className={`text-xs ${muted}`}>{batch.filename} · {batch.recordCount.toLocaleString()} records · uploaded {new Date(batch.createdAt).toLocaleDateString()} · reminder {batch.expiresAt ? new Date(batch.expiresAt).toLocaleDateString() : "—"}</p></div><div className="flex gap-2"><button title="Download original" onClick={() => imeoFeedApi.download(provider, batch).catch((e) => setNotice({ ok: false, text: errorText(e) }))} className={`p-2 rounded-lg ${darkMode ? "bg-[#0b0e14] text-gray-300" : "bg-gray-100 text-gray-600"}`}><CloudDownload size={16}/></button>{selectedMode === "manual" && <button disabled={activeManual || !!busy} onClick={() => run(`restore-${batch.id}`, () => imeoFeedApi.restore(provider, batch.id), `${batch.reportingMonth} activated for the map.`)} className="px-3 py-2 rounded-lg bg-[#009688]/10 text-[#009688] disabled:opacity-40 text-xs font-bold">{activeManual ? "Active" : "Activate"}</button>}<button title="Delete archived upload" disabled={activeManual || !!busy} onClick={() => setPendingDelete(batch)} className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-30 ${darkMode ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100"}`}><Trash2 size={16}/></button></div></div>; })}{!history.length && <p className={`rounded-xl border border-dashed p-5 text-center text-sm ${darkMode ? "border-white/10" : "border-slate-200"} ${muted}`}>No manual uploads yet.</p>}</div></section>

    {showManualLock && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="manual-lock-title" onClick={() => setShowManualLock(false)}><div className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl ${darkMode ? "border-white/10 bg-[#111722]" : "border-slate-200 bg-white"}`} onClick={(event) => event.stopPropagation()}><button type="button" aria-label="Close" onClick={() => setShowManualLock(false)} className={`absolute right-4 top-4 rounded-lg p-1.5 ${darkMode ? "text-gray-400 hover:bg-white/5" : "text-gray-400 hover:bg-slate-100"}`}><X size={17}/></button><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500"><LockKeyhole size={21}/></div><h3 id="manual-lock-title" className={`mt-4 text-lg font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>Test the live API first</h3><p className={`mt-2 text-sm leading-relaxed ${muted}`}>Manual Upload is a fallback. Test the {label} API first so NOGIET can confirm whether the live source is available.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setShowManualLock(false)} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${darkMode ? "text-gray-300 hover:bg-white/5" : "text-slate-600 hover:bg-slate-100"}`}>Cancel</button><button type="button" disabled={!!busy} onClick={() => { setShowManualLock(false); run("test", testApi, `${label} API test succeeded. You can now use it on the map.`); }} className="flex items-center gap-2 rounded-xl bg-[#009688] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><RefreshCw size={15}/>Test live API</button></div></div></div>}

    {showApiSwitch && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="api-switch-title" onClick={() => setShowApiSwitch(false)}><div className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl ${darkMode ? "border-white/10 bg-[#111722]" : "border-slate-200 bg-white"}`} onClick={(event) => event.stopPropagation()}><button type="button" aria-label="Close" onClick={() => setShowApiSwitch(false)} className={`absolute right-4 top-4 rounded-lg p-1.5 ${darkMode ? "text-gray-400 hover:bg-white/5" : "text-gray-400 hover:bg-slate-100"}`}><X size={17}/></button><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500"><RefreshCw size={21}/></div><h3 id="api-switch-title" className={`mt-4 text-lg font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{label} API is available</h3><p className={`mt-2 text-sm leading-relaxed ${muted}`}>Switch the Live Map to the API now? Manual records and original uploads will be deactivated but retained in the archive for future business use.</p><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setShowApiSwitch(false); setApiVerified(false); }} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${darkMode ? "text-gray-300 hover:bg-white/5" : "text-slate-600 hover:bg-slate-100"}`}>Keep using Manual</button><button type="button" disabled={!!busy} onClick={() => { setShowApiSwitch(false); run("activate-api", () => imeoFeedApi.setMode(provider, "api"), `${label} API is active. Manual data remains archived.`).then((ok) => { if (ok) setSelectedMode("api"); }); }} className="rounded-xl bg-[#009688] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Switch to API</button></div></div></div>}

    {pendingDelete && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-upload-title" onClick={() => setPendingDelete(null)}><div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${darkMode ? "border-white/10 bg-[#111722]" : "border-slate-200 bg-white"}`} onClick={(event) => event.stopPropagation()}><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-500"><Trash2 size={21}/></div><h3 id="delete-upload-title" className={`mt-4 text-lg font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>Delete archived upload?</h3><p className={`mt-2 text-sm leading-relaxed ${muted}`}>{pendingDelete.filename} and its {pendingDelete.recordCount.toLocaleString()} normalized records will be permanently removed from the database, backend folder and R2 backup.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setPendingDelete(null)} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${darkMode ? "text-gray-300 hover:bg-white/5" : "text-slate-600 hover:bg-slate-100"}`}>Cancel</button><button type="button" disabled={!!busy} onClick={() => { const batch = pendingDelete; setPendingDelete(null); run(`delete-${batch.id}`, () => imeoFeedApi.deleteBatch(provider, batch.id), `${batch.filename} deleted from the archive.`); }} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">Delete permanently</button></div></div></div>}
  </div>;
}
