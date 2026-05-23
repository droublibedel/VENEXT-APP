"use client";

export function ExecutiveOperationsOverviewSurface(props: { executiveOperationsScore: number; resilienceStrength: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="executive-operations-overview-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Score executive operations</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.executiveOperationsScore}</p>
      <p className="text-[9px] text-slate-400">Résilience {props.resilienceStrength}</p>
    </div>
  );
}

export function ExecutiveOperationsGridSurface(props: { matrixCount: number }) {
  return (
    <div className="rounded border border-violet-900/40 bg-slate-950/80 p-2" data-testid="executive-operations-grid-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-violet-200/80">Grilles supervision</p>
      <p className="mt-1 font-mono text-lg text-violet-100">{props.matrixCount}</p>
      <p className="text-[9px] text-slate-500">templates déterministes — pas IA</p>
    </div>
  );
}

export function ExecutiveOperationsPressureSurface(props: {
  executivePressure: number;
  systemicConcentration: number;
}) {
  return (
    <div className="rounded border border-rose-900/40 bg-slate-950/80 p-2" data-testid="executive-operations-pressure-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-rose-200/80">Pression systémique</p>
      <p className="mt-1 font-mono text-lg text-rose-100">{props.executivePressure}</p>
      <p className="text-[9px] text-slate-400">Concentration exécutive {props.systemicConcentration}</p>
    </div>
  );
}

export function ExecutiveOperationsPrioritySurface(props: { executiveUrgency: number }) {
  return (
    <div className="rounded border border-cyan-900/40 bg-slate-950/80 p-2" data-testid="executive-operations-priority-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-cyan-200/80">Urgence supervision</p>
      <p className="mt-1 font-mono text-lg text-cyan-100">{props.executiveUrgency}</p>
    </div>
  );
}

export function ExecutiveOperationsHistorySurface(props: { signalCount: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="executive-operations-history-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Signaux command</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.signalCount}</p>
    </div>
  );
}

export function ExecutiveOperationsSystemicSurface(props: { strategicBalanceScore: number }) {
  return (
    <div className="rounded border border-indigo-900/40 bg-slate-950/80 p-2" data-testid="executive-operations-systemic-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-indigo-200/80">Équilibre stratégique</p>
      <p className="mt-1 font-mono text-lg text-indigo-100">{props.strategicBalanceScore}</p>
      <p className="text-[9px] text-slate-500">lecture supervision — pas exécution</p>
    </div>
  );
}
