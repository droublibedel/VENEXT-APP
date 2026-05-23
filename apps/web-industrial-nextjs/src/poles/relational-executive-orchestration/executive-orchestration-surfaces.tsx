"use client";

export function ExecutiveOrchestrationOverviewSurface(props: {
  orchestrationScore: number;
  executiveResilience: number;
}) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="executive-orchestration-overview-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Matrice exécutive</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.orchestrationScore}</p>
      <p className="text-[9px] text-slate-400">Résilience {props.executiveResilience}</p>
    </div>
  );
}

export function ExecutiveOrchestrationDependencySurface(props: { dependencyCount: number }) {
  return (
    <div className="rounded border border-cyan-900/40 bg-slate-950/80 p-2" data-testid="executive-orchestration-dependency-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-cyan-200/80">Dépendances exécutives</p>
      <p className="mt-1 font-mono text-lg text-cyan-100">{props.dependencyCount}</p>
    </div>
  );
}

export function ExecutiveOrchestrationPressureSurface(props: {
  executiveCoordinationPressure: number;
  systemicExposure: number;
}) {
  return (
    <div className="rounded border border-rose-900/40 bg-slate-950/80 p-2" data-testid="executive-orchestration-pressure-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-rose-200/80">Pression coordination</p>
      <p className="mt-1 font-mono text-lg text-rose-100">{props.executiveCoordinationPressure}</p>
      <p className="text-[9px] text-slate-400">Exposition {props.systemicExposure}</p>
    </div>
  );
}

export function ExecutiveOrchestrationPrioritySurface(props: { executiveUrgency: number }) {
  return (
    <div className="rounded border border-amber-900/40 bg-slate-950/80 p-2" data-testid="executive-orchestration-priority-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-amber-200/80">Urgence exécutive</p>
      <p className="mt-1 font-mono text-lg text-amber-100">{props.executiveUrgency}</p>
    </div>
  );
}

export function ExecutiveOrchestrationHistorySurface(props: { signalCount: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="executive-orchestration-history-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Signaux orchestration</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.signalCount}</p>
    </div>
  );
}

export function ExecutiveOrchestrationSystemicSurface(props: { strategicAlignmentScore: number }) {
  return (
    <div className="rounded border border-violet-900/40 bg-slate-950/80 p-2" data-testid="executive-orchestration-systemic-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-violet-200/80">Alignement stratégique</p>
      <p className="mt-1 font-mono text-lg text-violet-100">{props.strategicAlignmentScore}</p>
      <p className="text-[9px] text-slate-500">supervision multi-corridor — lecture seule</p>
    </div>
  );
}
