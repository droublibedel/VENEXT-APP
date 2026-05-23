"use client";

export function StabilizationOverviewSurface(props: { stabilizationScore: number; resilienceLevel: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="stabilization-overview-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Stabilisation corridor</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.stabilizationScore}</p>
      <p className="text-[9px] text-slate-400">Résilience {props.resilienceLevel}</p>
    </div>
  );
}

export function StabilizationPressureSurface(props: { instabilityPressure: number }) {
  return (
    <div className="rounded border border-rose-900/40 bg-slate-950/80 p-2" data-testid="stabilization-pressure-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-rose-200/80">Pression instabilité</p>
      <p className="mt-1 font-mono text-lg text-rose-100">{props.instabilityPressure}</p>
    </div>
  );
}

export function StabilizationResilienceSurface(props: { resilienceLevel: number }) {
  return (
    <div className="rounded border border-emerald-900/30 bg-slate-950/80 p-2" data-testid="stabilization-resilience-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-emerald-200/80">Résilience corridor</p>
      <p className="mt-1 font-mono text-lg text-emerald-100">{props.resilienceLevel}</p>
    </div>
  );
}

export function StabilizationDependencySurface(props: { dependencyCount: number }) {
  return (
    <div className="rounded border border-cyan-900/40 bg-slate-950/80 p-2" data-testid="stabilization-dependency-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-cyan-200/80">Dépendances critiques</p>
      <p className="mt-1 font-mono text-lg text-cyan-100">{props.dependencyCount}</p>
    </div>
  );
}

export function StabilizationHistorySurface(props: { signalCount: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="stabilization-history-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Signaux stabilisation</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.signalCount}</p>
    </div>
  );
}

export function StabilizationSystemicSurface(props: { systemicExposure: number }) {
  return (
    <div className="rounded border border-violet-900/40 bg-slate-950/80 p-2" data-testid="stabilization-systemic-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-violet-200/80">Exposition systémique</p>
      <p className="mt-1 font-mono text-lg text-violet-100">{props.systemicExposure}</p>
      <p className="text-[9px] text-slate-500">coordination multi-corridor — lecture seule</p>
    </div>
  );
}
