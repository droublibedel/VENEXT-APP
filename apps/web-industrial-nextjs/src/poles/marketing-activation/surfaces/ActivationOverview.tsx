"use client";

import type { MarketingActivationOverviewResponse } from "@venext/shared-contracts";

export function ActivationOverview({ data }: { data: MarketingActivationOverviewResponse | undefined }) {
  if (!data) return null;
  return (
    <section className="space-y-3 rounded border border-violet-900/35 bg-violet-950/20 px-3 py-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-200/90">Activation overview</p>
          <p className="text-xs text-slate-500">Stimulation field — not campaign vanity metrics.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500">Activation confidence</p>
          <p className="font-mono text-lg text-violet-100">{data.activationConfidence.toFixed(2)}</p>
        </div>
      </header>
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ["Sponsorship pressure", data.sponsorshipPressure],
          ["Activation velocity", data.activationVelocity],
          ["Retailer engagement", data.retailerEngagementLevel],
          ["Product momentum", data.productMomentum],
          ["Campaign effectiveness", data.campaignEffectiveness],
          ["Territory stimulation", data.territoryStimulation],
          ["Commercial excitation", data.commercialExcitation],
          ["Inactive zones", data.inactiveActivationZones],
        ].map(([label, v]) => (
          <div key={String(label)} className="rounded border border-slate-800/80 bg-slate-950/60 px-2 py-2">
            <p className="text-[9px] uppercase tracking-wide text-slate-500">{label}</p>
            <p className="font-mono text-sm text-slate-100">{typeof v === "number" ? v.toFixed(2) : String(v)}</p>
            <div className="mt-1 h-1 overflow-hidden rounded bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-violet-700 to-fuchsia-600"
                style={{ width: `${Math.min(100, typeof v === "number" ? v * 100 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {data.seasonalPressure ? (
        <div className="rounded border border-amber-900/40 bg-amber-950/20 px-2 py-2 text-[11px] text-amber-100/90">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-amber-200/90">Seasonal / external pressure (MOCK_CONTEXT)</p>
          <p className="mt-1 text-slate-300/95">{data.seasonalPressure.explanation}</p>
          <p className="mt-1 font-mono text-[10px] text-slate-400">
            intensity {data.seasonalPressure.intensity.toFixed(2)} · confidence {data.seasonalPressure.confidence.toFixed(2)} ·{" "}
            {data.seasonalPressure.affectedTerritories.slice(0, 4).join(", ") || "—"}
          </p>
        </div>
      ) : null}
      <div className="space-y-2 border-t border-slate-800/80 pt-2">
        <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Stimulation strips</p>
        <ul className="flex flex-col gap-2">
          {data.signalStrips.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded bg-slate-900/70 px-2 py-1.5 text-[11px]">
              <span className="font-mono text-[9px] text-fuchsia-200/90">{s.vector}</span>
              <span className="text-slate-300">{s.label}</span>
              <span className="ml-auto font-mono text-violet-200/90">{s.tension.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
