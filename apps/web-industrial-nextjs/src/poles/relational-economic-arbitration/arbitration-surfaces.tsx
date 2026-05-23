"use client";

export function ArbitrationOverviewSurface(props: { arbitrationScore: number; systemicImpact: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="arbitration-overview-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Arbitrage corridor</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.arbitrationScore}</p>
      <p className="text-[9px] text-slate-400">Impact systémique {props.systemicImpact}</p>
    </div>
  );
}

export function ArbitrationConflictSurface(props: { conflictCount: number }) {
  return (
    <div className="rounded border border-rose-900/40 bg-slate-950/80 p-2" data-testid="arbitration-conflict-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-rose-200/80">Conflits en arbitrage</p>
      <p className="mt-1 font-mono text-lg text-rose-100">{props.conflictCount}</p>
    </div>
  );
}

export function ArbitrationScenarioSurface(props: { scenarioCount: number }) {
  return (
    <div className="rounded border border-cyan-900/40 bg-slate-950/80 p-2" data-testid="arbitration-scenario-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-cyan-200/80">Scénarios de résolution</p>
      <p className="mt-1 font-mono text-lg text-cyan-100">{props.scenarioCount}</p>
      <p className="text-[9px] text-slate-500">séquencement déterministe — pas exécution</p>
    </div>
  );
}

export function ArbitrationDecisionSurface(props: { decisionCount: number }) {
  return (
    <div className="rounded border border-amber-900/40 bg-slate-950/80 p-2" data-testid="arbitration-decision-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-amber-200/80">Décisions journalisées</p>
      <p className="mt-1 font-mono text-lg text-amber-100">{props.decisionCount}</p>
      <p className="text-[9px] text-slate-500">validation humaine requise</p>
    </div>
  );
}

export function ArbitrationPrioritySurface(props: { interventionUrgency: number }) {
  return (
    <div className="rounded border border-violet-900/40 bg-slate-950/80 p-2" data-testid="arbitration-priority-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-violet-200/80">Urgence intervention</p>
      <p className="mt-1 font-mono text-lg text-violet-100">{props.interventionUrgency}</p>
    </div>
  );
}

export function ArbitrationHistorySurface(props: { snapshotCount: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="arbitration-history-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Historique snapshots</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.snapshotCount}</p>
    </div>
  );
}
