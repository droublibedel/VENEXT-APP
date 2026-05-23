"use client";

/** Instruction 20.26 — analytical surface tiles (command-center, non-SaaS). */
export function ContinuityStabilitySurface(props: { continuityScore: number; economicStability: number }) {
  const { continuityScore, economicStability } = props;
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2">
      <p className="text-[9px] uppercase tracking-[0.22em] text-cyan-200/80">Stabilité corridor</p>
      <p className="mt-1 font-mono text-lg text-cyan-100">{continuityScore}</p>
      <p className="text-[9px] text-slate-400">Économique {economicStability}</p>
    </div>
  );
}

export function ContinuityPressureSurface(props: { instabilityRisk: number; systemicRisk: number }) {
  const { instabilityRisk, systemicRisk } = props;
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2">
      <p className="text-[9px] uppercase tracking-[0.22em] text-amber-200/80">Pression / instabilité</p>
      <p className="mt-1 font-mono text-lg text-amber-100">{instabilityRisk}</p>
      <p className="text-[9px] text-slate-400">Systémique {systemicRisk}</p>
    </div>
  );
}

export function ContinuityRecoverySurface(props: { recoveryProbability: number }) {
  const { recoveryProbability } = props;
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2">
      <p className="text-[9px] uppercase tracking-[0.22em] text-emerald-200/80">Récupération corridor</p>
      <p className="mt-1 font-mono text-lg text-emerald-100">{(recoveryProbability * 100).toFixed(0)}%</p>
    </div>
  );
}
