import React, { useMemo, useState } from 'react';
import {
  X,
  MapPin,
  Building2,
  Satellite,
  Activity,
  ChevronRight,
  ExternalLink,
  Hexagon,
  Layers,
  CalendarClock,
  Factory,
  Pencil,
  Save,
  Loader2,
} from 'lucide-react';
import type { NormalizedSource } from '../../src/api/emissions.api';
import { emissionsApi } from '../../src/api/emissions.api';
import { useAuthStore } from '../../src/stores/auth.store';
import { feedColor } from '../methane-trends/feeds';
import { applyOilBlockOverrideToCache, isPointInsidePolygon } from './boundaryLayers';

export interface OilBlockData {
  properties: Record<string, any>;
  geometry: GeoJSON.Geometry | null;
  /** State name detected via point-in-polygon at the block centroid. */
  state?: string | null;
  /** LGA name detected via point-in-polygon at the block centroid. */
  lga?: string | null;
  /** Centroid coordinates (for display + zoom-to actions). */
  centroid?: { lon: number; lat: number };
}

interface FacilityLike {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  operator?: string;
  sector?: string;
  facilityType?: string;
  alertThreshold?: number | null;
}

interface OilBlockDetailModalProps {
  darkMode: boolean;
  block: OilBlockData;
  /** All currently-visible satellite plumes (filtered by the live map filters). */
  satelliteSources: NormalizedSource[];
  /** All currently-visible facilities (filtered by the live map filters). */
  facilities: FacilityLike[];
  onClose: () => void;
  /** Fires when the user clicks "View Methane Trends" — parent navigates and may prefill filters. */
  onOpenMethaneTrends: (context: { blockName: string; state: string | null; lga: string | null }) => void;
  /** Optional callback for "fly to block centroid" action. */
  onFlyTo?: (lng: number, lat: number) => void;
  onBlockUpdated?: (properties: Record<string, any>) => void;
}

const PROVIDER_LABEL: Record<string, string> = {
  carbon_mapper: 'Carbon Mapper',
  imeo: 'IMEO (UNEP)',
  tropomi: 'TROPOMI',
};

const OilBlockDetailModal: React.FC<OilBlockDetailModalProps> = ({
  darkMode: dm,
  block,
  satelliteSources,
  facilities,
  onClose,
  onOpenMethaneTrends,
  onFlyTo,
  onBlockUpdated,
}) => {
  const user = useAuthStore((s) => s.user);
  const props = block.properties ?? {};
  const blockId = String(props.block_id ?? props.id ?? props.name ?? '');
  const blockName: string = props.name ?? 'Unknown block';
  const blockType: string = props.type ?? '';
  const operator: string = props.operator ?? '';
  const terrain: string = props.terrain ?? '';
  const basin: string = props.basin ?? '';
  const status: string = props.status ?? '';
  const contract: string = props.contract ?? '';
  const rights: string = props.rights ?? '';
  const awardDate: string = props.award_date ?? '';
  const areaKm2: string = props.area_sqkm
    ? `${Number(props.area_sqkm).toLocaleString()} km²`
    : '';
  const canEdit = ['super_admin', 'admin', 'regulator'].includes(user?.role ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: String(blockName ?? ''),
    type: String(blockType ?? ''),
    status: String(status ?? ''),
    operator: String(operator ?? ''),
    terrain: String(terrain ?? ''),
    basin: String(basin ?? ''),
    areaSqkm: String(props.area_sqkm ?? ''),
    awardDate: String(awardDate ?? ''),
    contract: String(contract ?? ''),
    rights: String(rights ?? ''),
  });

  const updateEditField = (key: keyof typeof editForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveOilBlock = async () => {
    if (!blockId) return;
    setIsSaving(true);
    setEditError(null);
    try {
      const res = await emissionsApi.updateOilBlockOverride(blockId, editForm);
      const updated = applyOilBlockOverrideToCache(res.data) ?? { ...props, ...res.data.properties };
      onBlockUpdated?.(updated);
      setIsEditing(false);
    } catch (err: any) {
      setEditError(err?.message ?? 'Failed to update oil block metadata');
    } finally {
      setIsSaving(false);
    }
  };

  // Plumes whose centroid lies inside the clicked block polygon.
  // We use the loaded block geometry (no extra network call) and the in-memory
  // satellite store, so this is sub-millisecond for ~500 plumes / ~300 blocks.
  const plumesInside = useMemo<NormalizedSource[]>(() => {
    if (!block.geometry || satelliteSources.length === 0) return [];
    return satelliteSources.filter((s) =>
      isPointInsidePolygon(s.longitude, s.latitude, block.geometry),
    );
  }, [block.geometry, satelliteSources]);

  // Facilities likewise — only those inside the polygon.
  const facilitiesInside = useMemo<FacilityLike[]>(() => {
    if (!block.geometry || facilities.length === 0) return [];
    return facilities.filter((f) =>
      Number.isFinite(f.latitude)
        && Number.isFinite(f.longitude)
        && isPointInsidePolygon(f.longitude, f.latitude, block.geometry),
    );
  }, [block.geometry, facilities]);

  // Per-provider plume count, used to power the stat chips + grouped lists.
  const plumesByProvider = useMemo(() => {
    const out: Record<string, NormalizedSource[]> = {};
    for (const p of plumesInside) {
      const key = p.provider ?? 'unknown';
      (out[key] ??= []).push(p);
    }
    return out;
  }, [plumesInside]);

  // Top 5 emitters surface the loudest sources without overwhelming the modal.
  const topEmitters = useMemo(
    () => [...plumesInside].sort((a, b) => (b.emissionRate ?? 0) - (a.emissionRate ?? 0)).slice(0, 5),
    [plumesInside],
  );

  const totalRate = useMemo(
    () => plumesInside.reduce((sum, p) => sum + (p.emissionRate ?? 0), 0),
    [plumesInside],
  );

  // Theme tokens — match the FacilityDetailModal so the two detail surfaces
  // feel like the same component family.
  const shell = dm ? 'bg-[#12161f] text-white' : 'bg-white text-gray-900';
  const headerBg = dm ? 'bg-[#0b0e14]/50 border-[#1e2430]' : 'bg-gray-50/50 border-gray-100';
  const sidebar = dm ? 'bg-[#0b0e14] border-[#1e2430]' : 'bg-gray-50 border-gray-100';
  const muted = dm ? 'text-gray-400' : 'text-gray-500';
  const card = dm ? 'bg-[#1a1f2b] border-[#1e2430]' : 'bg-gray-50 border-gray-200';
  const divider = dm ? 'border-[#1e2430]' : 'border-gray-100';

  const stateLabel = block.state ?? '—';
  const lgaLabel = block.lga ?? '—';

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 z-[100]"
      onClick={onClose}
    >
      <div
        className={`rounded-3xl w-full max-w-6xl h-[92vh] max-h-[860px] shadow-2xl overflow-hidden flex flex-col ${shell}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 md:px-10 py-5 border-b flex justify-between items-start gap-4 ${headerBg}`}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <Hexagon size={18} className="text-teal-500 flex-shrink-0" />
              {blockType && (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${dm ? 'bg-teal-500/15 text-teal-400' : 'bg-teal-50 text-teal-700'}`}>
                  {blockType}
                </span>
              )}
              {status && (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${statusBadgeClass(status, dm)}`}>
                  {status}
                </span>
              )}
            </div>
            <h2 className={`text-xl md:text-2xl font-bold truncate ${dm ? 'text-white' : 'text-gray-900'}`} title={blockName}>
              {blockName}
            </h2>
            <p className={`text-xs md:text-sm mt-1 ${muted} flex items-center gap-2`}>
              <MapPin size={14} className="text-teal-500" />
              {stateLabel} State{lgaLabel !== '—' ? ` · ${lgaLabel} LGA` : ''}
              {operator ? <> · <Building2 size={12} className="inline" /> {operator}</> : null}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {canEdit && (
              <button
                onClick={() => setIsEditing((v) => !v)}
                className={`p-2.5 rounded-full transition-colors ${isEditing ? 'bg-teal-600 text-white' : dm ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500'}`}
                aria-label={isEditing ? 'Cancel oil block edit' : 'Edit oil block metadata'}
                title={isEditing ? 'Cancel edit' : 'Edit oil block'}
              >
                {isEditing ? <X size={18} /> : <Pencil size={18} />}
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2.5 rounded-full transition-colors ${dm ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500'}`}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body: left sidebar (block metadata) + right content (plumes + facilities) */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Sidebar — block metadata */}
          <div className={`w-full md:w-80 md:border-r border-b md:border-b-0 ${sidebar} overflow-y-auto p-6 md:p-8 space-y-5 flex-shrink-0`}>
            <SectionTitle dm={dm}>Block info</SectionTitle>
            {isEditing ? (
              <div className="space-y-3">
                <EditInput dm={dm} label="Name" value={editForm.name} onChange={(v) => updateEditField('name', v)} />
                <EditInput dm={dm} label="Type" value={editForm.type} onChange={(v) => updateEditField('type', v)} />
                <EditInput dm={dm} label="Status" value={editForm.status} onChange={(v) => updateEditField('status', v)} />
                <EditInput dm={dm} label="Operator" value={editForm.operator} onChange={(v) => updateEditField('operator', v)} />
                <EditInput dm={dm} label="Terrain" value={editForm.terrain} onChange={(v) => updateEditField('terrain', v)} />
                <EditInput dm={dm} label="Basin" value={editForm.basin} onChange={(v) => updateEditField('basin', v)} />
                <EditInput dm={dm} label="Area" value={editForm.areaSqkm} onChange={(v) => updateEditField('areaSqkm', v)} />
                <EditInput dm={dm} label="Contract" value={editForm.contract} onChange={(v) => updateEditField('contract', v)} />
                <EditInput dm={dm} label="Rights" value={editForm.rights} onChange={(v) => updateEditField('rights', v)} />
                <EditInput dm={dm} label="Awarded" value={editForm.awardDate} onChange={(v) => updateEditField('awardDate', v)} />
                {editError && <p className="text-xs font-semibold text-red-400">{editError}</p>}
                <button
                  onClick={saveOilBlock}
                  disabled={isSaving}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Save changes
                </button>
              </div>
            ) : (
              <>
                <MetaRow dm={dm} label="Operator" value={operator || '—'} />
                <MetaRow dm={dm} label="Terrain" value={terrain || '—'} />
                <MetaRow dm={dm} label="Basin" value={basin || '—'} />
                <MetaRow dm={dm} label="Area" value={areaKm2 || '—'} />
                <MetaRow dm={dm} label="Contract" value={contract || '—'} />
                <MetaRow dm={dm} label="Rights" value={rights || '—'} />
                <MetaRow dm={dm} label="Awarded" value={awardDate || '—'} />
              </>
            )}

            <hr className={`${divider}`} />

            <SectionTitle dm={dm}>Location</SectionTitle>
            <MetaRow dm={dm} label="State" value={stateLabel} />
            <MetaRow dm={dm} label="LGA" value={lgaLabel} />
            {block.centroid && (
              <MetaRow
                dm={dm}
                label="Centroid"
                value={`${block.centroid.lat.toFixed(4)}°N, ${block.centroid.lon.toFixed(4)}°E`}
              />
            )}
            {block.centroid && onFlyTo && (
              <button
                onClick={() => onFlyTo(block.centroid!.lon, block.centroid!.lat)}
                className={`mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${dm ? 'bg-white/5 hover:bg-white/10 text-gray-200' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'}`}
              >
                <MapPin size={12} /> Zoom to block
              </button>
            )}
          </div>

          {/* Right content area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {/* Stat chips row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard dm={dm} icon={<Satellite size={16} />} label="Plumes in block" value={plumesInside.length} accent="teal" />
              <StatCard dm={dm} icon={<Factory size={16} />} label="Facilities" value={facilitiesInside.length} accent="amber" />
              <StatCard dm={dm} icon={<Activity size={16} />} label="Total CH₄ rate" value={`${totalRate.toFixed(1)} kg/h`} accent="rose" />
              <StatCard dm={dm} icon={<Layers size={16} />} label="Data sources" value={Object.keys(plumesByProvider).length} accent="slate" />
            </div>

            {/* Plumes section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <SectionTitle dm={dm}>Methane sources in this block</SectionTitle>
                {plumesInside.length > 0 && (
                  <span className={`text-[11px] ${muted}`}>{plumesInside.length} total</span>
                )}
              </div>
              {plumesInside.length === 0 ? (
                <EmptyState dm={dm} text="No satellite-detected methane sources fall inside this block yet." />
              ) : (
                <div className={`rounded-xl border ${card} overflow-hidden`}>
                  {/* Per-provider summary row */}
                  <div className={`px-4 py-3 flex flex-wrap gap-3 border-b ${divider}`}>
                    {Object.entries(plumesByProvider).map(([provider, list]) => (
                      <span key={provider} className={`inline-flex items-center gap-1.5 text-xs font-semibold ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span
                          aria-hidden
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: feedColor(provider as any, list[0]?.instrument ?? '') }}
                        />
                        {PROVIDER_LABEL[provider] ?? provider}
                        <span className={muted}>· {list.length}</span>
                      </span>
                    ))}
                  </div>

                  {/* Top emitters */}
                  <div className="divide-y divide-inherit">
                    {topEmitters.map((p) => (
                      <div key={p.id} className={`px-4 py-3 flex items-center justify-between gap-3 ${dm ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'}`}>
                        <div className="min-w-0 flex items-center gap-3">
                          <span
                            aria-hidden
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: feedColor(p.provider as any, p.instrument ?? '') }}
                          />
                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`} title={p.name}>
                              {p.name}
                            </p>
                            <p className={`text-[11px] ${muted}`}>
                              {PROVIDER_LABEL[p.provider] ?? p.provider}
                              {p.instrument ? ` · ${p.instrument}` : ''}
                              {p.lastDetected ? ` · ${new Date(p.lastDetected).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-bold tabular-nums ${p.emissionRate > 0 ? (dm ? 'text-teal-300' : 'text-teal-700') : muted}`}>
                            {p.emissionRate > 0 ? `${p.emissionRate.toFixed(1)} kg/h` : '—'}
                          </p>
                          <p className={`text-[10px] ${muted}`}>{p.plumeCount} plume{p.plumeCount === 1 ? '' : 's'}</p>
                        </div>
                      </div>
                    ))}
                    {plumesInside.length > topEmitters.length && (
                      <div className={`px-4 py-2 text-[11px] text-center ${muted}`}>
                        + {plumesInside.length - topEmitters.length} more — open Methane Trends for the full list.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Facilities section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <SectionTitle dm={dm}>Facilities in this block</SectionTitle>
                {facilitiesInside.length > 0 && (
                  <span className={`text-[11px] ${muted}`}>{facilitiesInside.length} total</span>
                )}
              </div>
              {facilitiesInside.length === 0 ? (
                <EmptyState dm={dm} text="No registered facilities are inside this block." />
              ) : (
                <div className={`rounded-xl border ${card} divide-y divide-inherit overflow-hidden`}>
                  {facilitiesInside.slice(0, 8).map((f) => (
                    <div key={f.id} className={`px-4 py-3 flex items-center justify-between gap-3 ${dm ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'}`}>
                      <div className="min-w-0 flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${dm ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                          <Factory size={14} />
                        </span>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`} title={f.name}>
                            {f.name}
                          </p>
                          <p className={`text-[11px] ${muted}`}>
                            {f.operator || 'Operator unknown'}
                            {f.facilityType ? ` · ${f.facilityType}` : ''}
                          </p>
                        </div>
                      </div>
                      <p className={`text-[11px] tabular-nums ${muted} flex-shrink-0`}>
                        {f.latitude.toFixed(3)}°, {f.longitude.toFixed(3)}°
                      </p>
                    </div>
                  ))}
                  {facilitiesInside.length > 8 && (
                    <div className={`px-4 py-2 text-[11px] text-center ${muted}`}>
                      + {facilitiesInside.length - 8} more
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Footer actions */}
        <div className={`px-6 md:px-10 py-5 border-t flex flex-col sm:flex-row gap-3 sm:justify-end ${dm ? 'bg-[#0b0e14]/50 border-[#1e2430]' : 'bg-gray-50 border-gray-100'}`}>
          <button
            onClick={onClose}
            className={`order-2 sm:order-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium border-2 transition-all ${dm ? 'border-[#1e2430] text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'}`}
          >
            Close
          </button>
          <button
            onClick={() => onOpenMethaneTrends({ blockName, state: block.state ?? null, lga: block.lga ?? null })}
            className="order-1 sm:order-2 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-2xl text-sm font-bold hover:bg-teal-700 shadow-lg transition-all"
          >
            <CalendarClock size={16} /> View Methane Trends
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Subcomponents ---

const SectionTitle: React.FC<{ dm: boolean; children: React.ReactNode }> = ({ dm, children }) => (
  <h3 className={`text-[11px] font-bold uppercase tracking-widest ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
    {children}
  </h3>
);

const MetaRow: React.FC<{ dm: boolean; label: string; value: string }> = ({ dm, label, value }) => (
  <div className="flex justify-between items-baseline gap-3">
    <span className={`text-[11px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{label}</span>
    <span className={`text-xs font-semibold text-right truncate ${dm ? 'text-gray-200' : 'text-gray-800'}`} title={value}>
      {value}
    </span>
  </div>
);

const EditInput: React.FC<{ dm: boolean; label: string; value: string; onChange: (value: string) => void }> = ({ dm, label, value, onChange }) => (
  <label className="block">
    <span className={`block text-[10px] font-bold uppercase tracking-wide mb-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
      {label}
    </span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none transition-colors ${dm ? 'bg-[#12161f] border-[#1e2430] text-gray-100 focus:border-teal-500' : 'bg-white border-gray-200 text-gray-900 focus:border-teal-500'}`}
    />
  </label>
);

const StatCard: React.FC<{
  dm: boolean;
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent: 'teal' | 'amber' | 'rose' | 'slate';
}> = ({ dm, icon, label, value, accent }) => {
  const accentClasses: Record<typeof accent, string> = {
    teal: dm ? 'text-teal-400 bg-teal-500/15' : 'text-teal-700 bg-teal-50',
    amber: dm ? 'text-amber-400 bg-amber-500/15' : 'text-amber-700 bg-amber-50',
    rose: dm ? 'text-rose-300 bg-rose-500/15' : 'text-rose-700 bg-rose-50',
    slate: dm ? 'text-gray-300 bg-white/5' : 'text-gray-700 bg-gray-100',
  };
  return (
    <div className={`p-4 rounded-xl border ${dm ? 'border-[#1e2430] bg-[#1a1f2b]' : 'border-gray-200 bg-white'}`}>
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2 ${accentClasses[accent]}`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold tabular-nums ${dm ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      <p className={`text-[11px] ${dm ? 'text-gray-500' : 'text-gray-400'} mt-0.5`}>{label}</p>
    </div>
  );
};

const EmptyState: React.FC<{ dm: boolean; text: string }> = ({ dm, text }) => (
  <div className={`rounded-xl border-2 border-dashed py-8 text-center ${dm ? 'border-[#1e2430] text-gray-500' : 'border-gray-200 text-gray-400'}`}>
    <ExternalLink className="mx-auto mb-2 opacity-50" size={16} />
    <p className="text-xs">{text}</p>
  </div>
);

function statusBadgeClass(status: string, dm: boolean): string {
  const s = status.toLowerCase();
  if (s.includes('active') || s.includes('production')) {
    return dm ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700';
  }
  if (s.includes('exploration')) {
    return dm ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-700';
  }
  if (s.includes('offered') || s.includes('open')) {
    return dm ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-700';
  }
  return dm ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-700';
}

export default OilBlockDetailModal;
