import React, { useMemo, useState } from "react";
import {
  MapPin,
  Camera,
  Send,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Building2,
  Cloud,
  Wrench,
  Gauge,
  FileText,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  useFacilities,
  useCreateFieldSubmission,
  useFieldSubmissions,
  useReviewFieldSubmission,
} from "../src/hooks/useEmissions";
import { useAuthStore } from "../src/stores/auth.store";

const STEPS = ["Facility", "Location", "Measurement", "Review"] as const;
const TEAL = "bg-[#009688] hover:bg-[#00796b]";
const TOTAL_STEPS = STEPS.length;

interface FieldDataFormProps {
  darkMode: boolean;
}

function statusBadgeClass(status: string, darkMode: boolean): string {
  const s = status.toLowerCase();
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide";
  if (s === "approved")
    return `${base} border-emerald-500/40 bg-emerald-500/15 ${darkMode ? "text-emerald-400" : "text-emerald-700"}`;
  if (s === "rejected")
    return `${base} border-red-500/40 bg-red-500/15 ${darkMode ? "text-red-400" : "text-red-700"}`;
  if (s === "pending")
    return `${base} border-amber-500/40 bg-amber-500/15 ${darkMode ? "text-amber-400" : "text-amber-800"}`;
  return `${base} ${darkMode ? "border-[#1e2430] bg-[#0b0e14] text-gray-400" : "border-gray-200 bg-gray-100 text-gray-600"}`;
}

export const FieldDataForm: React.FC<FieldDataFormProps> = ({ darkMode }) => {
  const [step, setStep] = useState(0);
  const [facilityId, setFacilityId] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [weatherConditions, setWeatherConditions] = useState("");
  const [equipmentUsed, setEquipmentUsed] = useState("");
  const [methaneReading, setMethaneReading] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";

  const {
    data: facilities = [],
    isLoading: facilitiesLoading,
    isError: facilitiesError,
    error: facilitiesLoadError,
  } = useFacilities();
  const { data: submissions = [], isLoading: submissionsLoading } =
    useFieldSubmissions(facilityId || undefined);
  const allSubmissions = useFieldSubmissions();
  const createSubmission = useCreateFieldSubmission();
  const reviewSubmission = useReviewFieldSubmission();

  const displaySubmissions = isAdmin && !facilityId
    ? (allSubmissions.data ?? [])
    : (submissions ?? []);

  const selectedFacility = useMemo(
    () => facilities.find((f) => f.id === facilityId),
    [facilities, facilityId],
  );

  const facilityErrorMessage = facilitiesLoadError instanceof Error
    ? facilitiesLoadError.message
    : "Could not load facilities.";

  const shell = darkMode
    ? "bg-[#12161f] border-[#1e2430] text-white"
    : "bg-white border-gray-200 text-gray-900";
  const inner = darkMode
    ? "bg-[#1a1f2b] border-[#1e2430]"
    : "bg-gray-50 border-gray-200";
  const inputBase =
    "w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[#009688]/40 " +
    (darkMode
      ? "border-[#1e2430] bg-[#0b0e14] text-white placeholder:text-gray-600"
      : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400");

  const fillGps = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported in this browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(+pos.coords.latitude.toFixed(6));
        setLongitude(+pos.coords.longitude.toFixed(6));
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(err.message || "Could not read location.");
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setPhotos((p) => [...p, url].slice(0, 5));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const validateStep = (i: number): boolean => {
    setStepError(null);
    if (i === 0 && !facilityId) {
      setStepError("Select a facility to continue.");
      return false;
    }
    if (i === 1) {
      if (latitude === null || longitude === null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
        setStepError("Set your location using GPS or enter coordinates.");
        return false;
      }
      if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        setStepError("Enter valid latitude (−90–90) and longitude (−180–180).");
        return false;
      }
    }
    if (i === 2) {
      const n = Number(methaneReading);
      if (methaneReading.trim() === "" || Number.isNaN(n) || n < 0) {
        setStepError("Enter a valid methane reading (non-negative number).");
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };
  const goBack = () => {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const resetForm = () => {
    setStep(0);
    setFacilityId("");
    setLatitude(null);
    setLongitude(null);
    setWeatherConditions("");
    setEquipmentUsed("");
    setMethaneReading("");
    setNotes("");
    setPhotos([]);
    setGpsError(null);
    setStepError(null);
  };

  const handleSubmit = () => {
    if (!facilityId) { setStepError("Select a facility."); setStep(0); return; }
    if (latitude === null || longitude === null || Number.isNaN(latitude) || Number.isNaN(longitude) || Math.abs(latitude!) > 90 || Math.abs(longitude!) > 180) {
      setStepError("Set valid GPS coordinates before submitting.");
      setStep(1);
      return;
    }
    const n = Number(methaneReading);
    if (methaneReading.trim() === "" || Number.isNaN(n) || n < 0) {
      setStepError("Enter a valid methane reading.");
      setStep(2);
      return;
    }
    setStepError(null);
    setSubmitSuccess(false);
    createSubmission.mutate(
      {
        facilityId,
        latitude: latitude!,
        longitude: longitude!,
        methaneReading: n,
        weatherConditions: weatherConditions.trim() || undefined,
        equipmentUsed: equipmentUsed.trim() || undefined,
        notes: notes.trim() || undefined,
        photos: photos.length ? photos : undefined,
      },
      {
        onSuccess: () => {
          setSubmitSuccess(true);
          resetForm();
          setTimeout(() => setSubmitSuccess(false), 4000);
        },
      },
    );
  };

  const handleReview = (id: string, status: "approved" | "rejected") => {
    reviewSubmission.mutate({ id, status });
  };

  return (
    <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${darkMode ? "bg-[#0b0e14] text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="mx-auto max-w-420">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Field Data Collection</h1>
        <p className={`mt-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Submit on-site methane readings and review past submissions.
        </p>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* LEFT — Form */}
          <div className="w-full lg:w-[680px] lg:flex-shrink-0">
            <div className={`rounded-2xl border p-4 shadow-sm sm:p-6 ${shell}`}>
              <h2 className="text-base font-bold tracking-tight sm:text-lg">New submission</h2>

              {/* Stepper */}
              <div className="mt-5 flex items-center gap-1 sm:gap-2">
                {STEPS.map((label, i) => (
                  <React.Fragment key={label}>
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition ${
                        i < step ? `${TEAL} text-white`
                          : i === step ? "bg-[#009688]/20 text-[#009688] ring-2 ring-[#009688]"
                            : darkMode ? "bg-[#0b0e14] text-gray-500 ring-1 ring-[#1e2430]" : "bg-gray-100 text-gray-400 ring-1 ring-gray-200"
                      }`}>
                        {i < step ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      <span className={`hidden truncate text-center text-[8px] font-bold uppercase tracking-wider sm:block ${
                        i === step ? "text-[#009688]" : darkMode ? "text-gray-500" : "text-gray-500"
                      }`}>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`mb-4 h-0.5 flex-1 max-w-[1.5rem] sm:max-w-none rounded ${i < step ? "bg-[#009688]" : darkMode ? "bg-[#1e2430]" : "bg-gray-200"}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {stepError && (
                <div className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                  darkMode ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-red-200 bg-red-50 text-red-800"
                }`}>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {stepError}
                </div>
              )}

              <div className="mt-5 space-y-4">
                {step === 0 && (
                  <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      <Building2 className="h-4 w-4 text-[#009688]" /> Facility
                    </label>
                    {facilitiesLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
                    ) : facilitiesError ? (
                      <div className={`rounded-xl border px-3 py-2 text-sm ${
                        darkMode ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-red-200 bg-red-50 text-red-700"
                      }`}>
                        <p className="font-semibold">Could not load facilities.</p>
                        <p className="mt-1 text-xs opacity-90">{facilityErrorMessage}</p>
                      </div>
                    ) : (
                      <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)} className={`${inputBase} cursor-pointer appearance-none`}>
                        <option value="">Select a facility</option>
                        {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    )}
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <MapPin className="h-4 w-4 text-[#009688]" /> GPS & coordinates
                      </label>
                      <button type="button" onClick={fillGps} disabled={gpsLoading}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-60 ${TEAL}`}>
                        {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                        {gpsLoading ? "Getting location…" : "Use current location"}
                      </button>
                      {gpsError && <p className="text-xs text-red-500">{gpsError}</p>}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className={`text-[10px] font-bold uppercase ${darkMode ? "text-gray-500" : "text-gray-500"}`}>Latitude</span>
                          <input type="number" step="any" value={latitude ?? ""} onChange={(e) => setLatitude(e.target.value === "" ? null : Number(e.target.value))} placeholder="e.g. 6.5244" className={`mt-1 ${inputBase}`} />
                        </div>
                        <div>
                          <span className={`text-[10px] font-bold uppercase ${darkMode ? "text-gray-500" : "text-gray-500"}`}>Longitude</span>
                          <input type="number" step="any" value={longitude ?? ""} onChange={(e) => setLongitude(e.target.value === "" ? null : Number(e.target.value))} placeholder="e.g. 3.3792" className={`mt-1 ${inputBase}`} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <Cloud className="h-4 w-4 text-[#009688]" /> Weather conditions
                      </label>
                      <input type="text" value={weatherConditions} onChange={(e) => setWeatherConditions(e.target.value)} placeholder="e.g. Clear, 28°C, light wind" className={inputBase} />
                    </div>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <Wrench className="h-4 w-4 text-[#009688]" /> Equipment used
                      </label>
                      <input type="text" value={equipmentUsed} onChange={(e) => setEquipmentUsed(e.target.value)} placeholder="e.g. Portable analyzer, OGI" className={inputBase} />
                    </div>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <Camera className="h-4 w-4 text-[#009688]" /> Site photo (optional)
                      </label>
                      <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 transition hover:border-[#009688]/50 ${inner}`}>
                        <Camera className="h-5 w-5 text-[#009688]" />
                        <span className="text-sm font-medium">Tap to capture or choose photo</span>
                        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPhotoChange} />
                      </label>
                      {photos.length > 0 && (
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{photos.length} photo{photos.length !== 1 ? "s" : ""} attached</p>
                      )}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <Gauge className="h-4 w-4 text-[#009688]" /> Methane reading
                      </label>
                      <input type="number" inputMode="decimal" step="any" min={0} value={methaneReading} onChange={(e) => setMethaneReading(e.target.value)}
                        placeholder="e.g. 12.5 (kg/hr)" className={inputBase} />
                    </div>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <FileText className="h-4 w-4 text-[#009688]" /> Notes
                      </label>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Observations, leak location, safety notes…"
                        className={`${inputBase} resize-y min-h-[80px]`} />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className={`space-y-3 rounded-xl border p-4 ${inner}`}>
                    <h3 className="text-sm font-bold text-[#009688]">Review</h3>
                    <dl className="space-y-2 text-sm">
                      <ReviewRow darkMode={darkMode} label="Facility" value={selectedFacility?.name ?? "—"} />
                      <ReviewRow darkMode={darkMode} label="Coordinates" value={latitude != null && longitude != null ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : "—"} mono />
                      <ReviewRow darkMode={darkMode} label="Weather" value={weatherConditions.trim() || "—"} />
                      <ReviewRow darkMode={darkMode} label="Equipment" value={equipmentUsed.trim() || "—"} />
                      <ReviewRow darkMode={darkMode} label="Methane" value={methaneReading || "—"} highlight />
                      <ReviewRow darkMode={darkMode} label="Photos" value={String(photos.length)} />
                      {notes.trim() && (
                        <div>
                          <dt className={darkMode ? "text-gray-500" : "text-gray-500"}>Notes</dt>
                          <dd className={`mt-1 whitespace-pre-wrap text-xs ${darkMode ? "text-gray-300" : "text-gray-800"}`}>{notes.trim()}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>

              {/* Nav buttons */}
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={goBack} disabled={step === 0}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:opacity-40 ${
                    darkMode ? "border-[#1e2430] bg-[#0b0e14] text-white hover:bg-[#1a1f2b]" : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                  }`}>
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                {step < TOTAL_STEPS - 1 ? (
                  <button type="button" onClick={goNext} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white ${TEAL}`}>
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={createSubmission.isPending}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 ${TEAL}`}>
                    {createSubmission.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {createSubmission.isPending ? "Submitting…" : "Submit"}
                  </button>
                )}
              </div>

              {createSubmission.isError && (
                <p className="mt-3 text-center text-xs font-medium text-red-500">
                  {(createSubmission.error as Error)?.message || "Submission failed. Try again."}
                </p>
              )}
              {submitSuccess && (
                <p className="mt-3 flex items-center justify-center gap-2 text-center text-sm font-bold text-[#009688]">
                  <CheckCircle className="h-4 w-4" /> Submitted successfully
                </p>
              )}
            </div>
          </div>

          {/* RIGHT — Past submissions */}
          <div className="min-w-0 flex-1">
            <div className={`rounded-2xl border shadow-sm ${shell}`}>
              <div className={`border-b px-5 py-4 ${darkMode ? "border-[#1e2430]" : "border-gray-200"}`}>
                <h3 className="text-base font-bold">Past field submissions</h3>
                <p className={`mt-0.5 text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {isAdmin ? "All submissions — review and approve/reject below." : "Your submissions for the selected facility."}
                </p>
              </div>
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto p-4 sm:p-5">
                {(submissionsLoading || allSubmissions.isLoading) ? (
                  <div className="flex items-center gap-2 py-8 justify-center text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </div>
                ) : displaySubmissions.length === 0 ? (
                  <p className={`py-8 text-center text-sm ${darkMode ? "text-gray-500" : "text-gray-600"}`}>
                    {facilityId ? "No submissions for this facility yet." : "Select a facility to see its submissions, or submit your first reading."}
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {displaySubmissions.map((sub) => (
                      <li key={sub.id} className={`rounded-xl border p-3 sm:p-4 ${darkMode ? "border-[#1e2430] bg-[#1a1f2b]" : "border-gray-200 bg-gray-50"}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`text-xs font-mono ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                            {new Date(sub.createdAt).toLocaleString()}
                          </span>
                          <span className={statusBadgeClass(sub.status, darkMode)}>{sub.status}</span>
                        </div>
                        <p className={`mt-2 text-sm font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                          Methane: {sub.methaneReading} kg/hr
                        </p>
                        <p className={`mt-1 text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {sub.latitude.toFixed(4)}, {sub.longitude.toFixed(4)}
                          {sub.weatherConditions ? ` · ${sub.weatherConditions}` : ""}
                          {sub.equipmentUsed ? ` · ${sub.equipmentUsed}` : ""}
                        </p>
                        {sub.notes && (
                          <p className={`mt-1 text-xs italic ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                            {sub.notes}
                          </p>
                        )}

                        {isAdmin && sub.status === "pending" && (
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => handleReview(sub.id, "approved")}
                              disabled={reviewSubmission.isPending}
                              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleReview(sub.id, "rejected")}
                              disabled={reviewSubmission.isPending}
                              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewRow: React.FC<{ darkMode: boolean; label: string; value: string; mono?: boolean; highlight?: boolean }> = ({ darkMode, label, value, mono, highlight }) => (
  <div className="flex justify-between gap-4">
    <dt className={darkMode ? "text-gray-500" : "text-gray-500"}>{label}</dt>
    <dd className={`text-right ${mono ? "font-mono text-xs" : "font-medium"} ${highlight ? "font-bold text-[#009688]" : ""}`}>{value}</dd>
  </div>
);

export default FieldDataForm;
