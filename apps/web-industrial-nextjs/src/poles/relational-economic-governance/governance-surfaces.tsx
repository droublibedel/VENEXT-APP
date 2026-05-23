"use client";

export function GovernanceOverviewSurface(props: { governanceScore: number; coordinationScore: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="governance-overview-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Gouvernance corridor</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.governanceScore}</p>
      <p className="text-[9px] text-slate-400">Coordination {props.coordinationScore}</p>
    </div>
  );
}

export function GovernanceConflictSurface(props: { conflictCount: number }) {
  return (
    <div className="rounded border border-rose-900/40 bg-slate-950/80 p-2" data-testid="governance-conflict-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-rose-200/80">Conflits relationnels</p>
      <p className="mt-1 font-mono text-lg text-rose-100">{props.conflictCount}</p>
      <p className="text-[9px] text-slate-500">détection analytique — pas résolution auto</p>
    </div>
  );
}

export function GovernancePrioritySurface(props: { interventionUrgency: number }) {
  return (
    <div className="rounded border border-amber-900/40 bg-slate-950/80 p-2" data-testid="governance-priority-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-amber-200/80">Urgence intervention</p>
      <p className="mt-1 font-mono text-lg text-amber-100">{props.interventionUrgency}</p>
    </div>
  );
}

export function GovernanceBalanceSurface(props: { governanceStability: number }) {
  return (
    <div className="rounded border border-emerald-900/30 bg-slate-950/80 p-2" data-testid="governance-balance-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-emerald-200/80">Stabilité gouvernance</p>
      <p className="mt-1 font-mono text-lg text-emerald-100">{props.governanceStability}</p>
    </div>
  );
}

export function GovernanceSystemicSurface(props: { systemicRisk: number }) {
  return (
    <div className="rounded border border-violet-900/40 bg-slate-950/80 p-2" data-testid="governance-systemic-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-violet-200/80">Risque systémique</p>
      <p className="mt-1 font-mono text-lg text-violet-100">{props.systemicRisk}</p>
    </div>
  );
}

export function GovernanceHistorySurface(props: { snapshotCount: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="governance-history-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Historique snapshots</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.snapshotCount}</p>
    </div>
  );
}
