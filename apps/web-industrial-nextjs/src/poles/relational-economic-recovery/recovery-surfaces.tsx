"use client";

export function RecoveryOverviewSurface(props: { recoveryScore: number; instabilityScore: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="recovery-overview-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Plan de reprise</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.recoveryScore}</p>
      <p className="text-[9px] text-slate-400">Instabilité {props.instabilityScore}</p>
    </div>
  );
}

export function RecoveryPrioritySurface(props: { interventionPriority: number }) {
  return (
    <div className="rounded border border-amber-900/40 bg-slate-950/80 p-2" data-testid="recovery-priority-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-amber-200/80">Priorité intervention</p>
      <p className="mt-1 font-mono text-lg text-amber-100">{props.interventionPriority}</p>
    </div>
  );
}

export function RecoveryDependencySurface(props: { stepCount: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="recovery-dependency-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Séquence recovery</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.stepCount}</p>
      <p className="text-[9px] text-slate-500">étapes planifiées — sans exécution auto</p>
    </div>
  );
}

export function RecoveryRiskSurface(props: { systemicImpactRisk: number }) {
  return (
    <div className="rounded border border-rose-900/30 bg-slate-950/80 p-2" data-testid="recovery-risk-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-rose-200/70">Risque systémique</p>
      <p className="mt-1 font-mono text-lg text-rose-100">{props.systemicImpactRisk}</p>
    </div>
  );
}

export function RecoveryHistorySurface(props: { snapshotCount: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="recovery-history-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Historique snapshots</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.snapshotCount}</p>
    </div>
  );
}

export function RecoverySystemicSurface(props: { corridorRecoveryProbability: number }) {
  return (
    <div className="rounded border border-emerald-900/30 bg-slate-950/80 p-2" data-testid="recovery-systemic-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-emerald-200/80">Probabilité reprise corridor</p>
      <p className="mt-1 font-mono text-lg text-emerald-100">{(props.corridorRecoveryProbability * 100).toFixed(0)}%</p>
    </div>
  );
}
