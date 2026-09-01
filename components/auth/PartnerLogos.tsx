import React from "react";

export default function PartnerLogos() {
  const hideMissing = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.closest<HTMLElement>('[data-sponsor]')?.classList.add('hidden');
  };

  return (
    <section className="mt-6 border-t border-slate-200/80 pt-5" aria-labelledby="project-sponsors-title">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" aria-hidden />
        <p id="project-sponsors-title" className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
          Owners
        </p>
        <span className="h-px flex-1 bg-slate-200" aria-hidden />
      </div>

      <div className="grid grid-cols-2 gap-2.5" aria-label="NOGIET project sponsors">
        <div data-sponsor className="group flex min-h-[82px] items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 transition hover:border-teal-600/20 hover:bg-white hover:shadow-sm">
          <img
            src="/branding/nuprc-logo.png"
            alt="Nigerian Upstream Petroleum Regulatory Commission logo"
            className="h-12 w-12 shrink-0 object-contain"
            onError={hideMissing}
          />
          <div className="min-w-0 text-left">
            <p className="text-[11px] font-extrabold tracking-wide text-slate-800">NUPRC</p>
            <p className="mt-0.5 text-[8px] font-medium leading-[1.35] text-slate-500">Nigerian Upstream Petroleum Regulatory Commission</p>
          </div>
        </div>

        <div data-sponsor className="group flex min-h-[82px] items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 transition hover:border-teal-600/20 hover:bg-white hover:shadow-sm">
          <img
            src="/branding/nmdpra-logo.png"
            alt="Nigerian Midstream and Downstream Petroleum Regulatory Authority logo"
            className="h-12 w-12 shrink-0 object-contain"
            onError={hideMissing}
          />
          <div className="min-w-0 text-left">
            <p className="text-[11px] font-extrabold tracking-wide text-slate-800">NMDPRA</p>
            <p className="mt-0.5 text-[8px] font-medium leading-[1.35] text-slate-500">Nigerian Midstream and Downstream Petroleum Regulatory Authority</p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[9px] font-medium text-slate-400">
        Owners of Nigeria’s national oil and gas emissions intelligence platform
      </p>
    </section>
  );
}
