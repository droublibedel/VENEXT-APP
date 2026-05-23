"use client";

import type { SponsorshipPressureObservatoryResponse } from "@venext/shared-contracts";

export function SponsorshipPressureObservatory({ data }: { data: SponsorshipPressureObservatoryResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-500">
        Sponsorship pressure observatory disabled — check{" "}
        <span className="font-mono text-violet-200/80">sponsorship_pressure_enabled</span> and sponsored lane flags.
      </div>
    );
  }
  return (
    <section className="space-y-2 rounded border border-fuchsia-900/30 bg-fuchsia-950/15 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-fuchsia-200/90">Sponsorship pressure</p>
        <p className="text-[11px] text-slate-500">
          Engine: <span className="font-mono text-slate-400">{data.engineReuse}</span>
        </p>
      </header>
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          ["Overexposure", data.overexposureIndex],
          ["Efficiency", data.efficiencyIndex],
          ["Territory saturation", data.territorySaturation],
          ["Concentration risk", data.concentrationRisk],
          ["Sponsorship decay", data.sponsorshipDecay],
          ["Retailer attraction", data.retailerAttraction],
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded border border-slate-800/70 px-2 py-1.5">
            <p className="text-[9px] text-slate-500">{k}</p>
            <p className="font-mono text-sm text-fuchsia-100">
              {typeof v === "number" ? v.toFixed(3) : "—"}
            </p>
          </div>
        ))}
      </div>
      {data.signals?.length ? (
        <ul className="space-y-1 text-[11px]">
          {data.signals.map((s) => (
            <li key={s.code} className="rounded border border-amber-900/30 bg-amber-950/20 px-2 py-1 text-amber-100/90">
              <span className="font-mono text-[10px] text-amber-200/80">{s.severity}</span> · {s.headline} — {s.detail}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
