"use client";

import type { EconomicCommandBundle } from "@venext/shared-contracts";

import { isEconomicCommandSliceMissing } from "./economic-command-fallback-build";

export function EconomicCommandOverviewSurface({ bundle }: { bundle: EconomicCommandBundle | null }) {
  if (!bundle) {
    return (
      <div className="rounded border border-amber-900/60 bg-amber-950/20 p-3 text-xs text-amber-100/90">
        <span className="font-semibold uppercase tracking-wide text-amber-200/90">Advisory · heuristique</span>
        <p className="mt-1 text-slate-400">Bundle indisponible — salle de commandement en attente de données.</p>
      </div>
    );
  }
  const d = bundle.diagnostics;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-200">
      {isEconomicCommandSliceMissing(bundle, "overview") ? (
        <p className="mb-2 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1 text-[10px] text-amber-100/90">
          Tranche <span className="font-mono">overview</span> non chargée — en-tête ci-dessous est un placeholder client.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-slate-500">
        <span className="rounded border border-amber-800/70 bg-amber-950/40 px-2 py-0.5 text-amber-100/90">Consultatif uniquement</span>
        <span className="rounded border border-violet-900/60 bg-violet-950/30 px-2 py-0.5 text-violet-100/85">Projection symbolique</span>
        <span className="rounded border border-cyan-900/50 bg-cyan-950/25 px-2 py-0.5 text-cyan-100/85">Proxies 0–1</span>
      </div>
      <h2 className="mt-2 text-sm font-semibold text-slate-100">Vue exécutive</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{bundle.overview.headline}</p>
      <p className="mt-2 text-[10px] text-slate-500">
        Posture coordination: {bundle.overview.executivePosture} · stress dominant: {bundle.overview.dominantStress} · digest:{" "}
        {bundle.overview.signalDigest}
      </p>
      <p className="mt-2 text-[10px] text-slate-500">
        Diagnostics — compose plan: propagation {d.composePlan.propagationCompose} · coordination{" "}
        {d.composePlan.coordinationCompose} · scenarios {d.composePlan.scenariosCompose} · memory {d.composePlan.memoryCompose}{" "}
        · data-intelligence {d.composePlan.dataIntelligenceCompose} · command {d.composePlan.commandCompose} (total{" "}
        {d.composeCount}) · {d.composeCountMeaning} · cache: {d.cacheStrategy} · projection: {d.projectionMode} · poids:{" "}
        {d.payloadWeightClass} · bundles embarqués: {String(d.sourceBundlesEmbedded)} · cache hit: {String(d.composeCacheHit)}
      </p>
      {d.fullProjectionWarning ? (
        <p className="mt-2 rounded border border-amber-900/50 bg-amber-950/25 px-2 py-1 text-[10px] text-amber-100/90">
          {d.fullProjectionWarning}
        </p>
      ) : null}
      <p className="mt-2 text-[10px] italic text-slate-500">{bundle.disclaimer}</p>
    </section>
  );
}
