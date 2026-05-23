"use client";

export function StrategicCommandOverviewSurface(props: { commandScore: number; resilienceStrength: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="strategic-command-overview-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Score command center</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.commandScore}</p>
      <p className="text-[9px] text-slate-400">Résilience {props.resilienceStrength}</p>
    </div>
  );
}

export function StrategicCommandGridSurface(props: { gridCount: number }) {
  return (
    <div className="rounded border border-violet-900/40 bg-slate-950/80 p-2" data-testid="strategic-command-grid-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-violet-200/80">Grilles supervision</p>
      <p className="mt-1 font-mono text-lg text-violet-100">{props.gridCount}</p>
      <p className="text-[9px] text-slate-500">templates déterministes — pas IA</p>
    </div>
  );
}

export function StrategicCommandPressureSurface(props: {
  systemicPressure: number;
  executiveConcentration: number;
}) {
  return (
    <div className="rounded border border-rose-900/40 bg-slate-950/80 p-2" data-testid="strategic-command-pressure-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-rose-200/80">Pression systémique</p>
      <p className="mt-1 font-mono text-lg text-rose-100">{props.systemicPressure}</p>
      <p className="text-[9px] text-slate-400">Concentration exécutive {props.executiveConcentration}</p>
    </div>
  );
}

export function StrategicCommandPrioritySurface(props: { executiveUrgency: number }) {
  return (
    <div className="rounded border border-cyan-900/40 bg-slate-950/80 p-2" data-testid="strategic-command-priority-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-cyan-200/80">Urgence supervision</p>
      <p className="mt-1 font-mono text-lg text-cyan-100">{props.executiveUrgency}</p>
    </div>
  );
}

export function StrategicCommandHistorySurface(props: { signalCount: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="strategic-command-history-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Signaux command</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.signalCount}</p>
    </div>
  );
}

export function StrategicCommandSystemicSurface(props: { strategicBalanceScore: number }) {
  return (
    <div className="rounded border border-indigo-900/40 bg-slate-950/80 p-2" data-testid="strategic-command-systemic-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-indigo-200/80">Équilibre stratégique</p>
      <p className="mt-1 font-mono text-lg text-indigo-100">{props.strategicBalanceScore}</p>
      <p className="text-[9px] text-slate-500">lecture supervision — pas exécution</p>
    </div>
  );
}
