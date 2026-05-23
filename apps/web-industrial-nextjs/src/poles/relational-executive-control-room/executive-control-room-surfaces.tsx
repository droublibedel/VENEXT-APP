"use client";

export function ExecutiveControlRoomOverviewSurface(props: { controlRoomScore: number; resilienceStrength: number }) {
  return (
    <div
      className="rounded border border-slate-800 bg-slate-950/80 p-2"
      data-testid="executive-control-room-overview-surface"
    >
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Score salle de contrôle</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.controlRoomScore}</p>
      <p className="text-[9px] text-slate-400">Résilience {props.resilienceStrength}</p>
    </div>
  );
}

export function ExecutiveControlRoomBoardSurface(props: { boardCount: number }) {
  return (
    <div
      className="rounded border border-violet-900/40 bg-slate-950/80 p-2"
      data-testid="executive-control-room-board-surface"
    >
      <p className="text-[9px] uppercase tracking-[0.22em] text-violet-200/80">Decision boards</p>
      <p className="mt-1 font-mono text-lg text-violet-100">{props.boardCount}</p>
      <p className="text-[9px] text-slate-500">templates déterministes — pas IA</p>
    </div>
  );
}

export function ExecutiveControlRoomPressureSurface(props: {
  executivePressure: number;
  systemicConcentration: number;
}) {
  return (
    <div
      className="rounded border border-rose-900/40 bg-slate-950/80 p-2"
      data-testid="executive-control-room-pressure-surface"
    >
      <p className="text-[9px] uppercase tracking-[0.22em] text-rose-200/80">Pression exécutive</p>
      <p className="mt-1 font-mono text-lg text-rose-100">{props.executivePressure}</p>
      <p className="text-[9px] text-slate-400">Concentration systémique {props.systemicConcentration}</p>
    </div>
  );
}

export function ExecutiveControlRoomPrioritySurface(props: { executiveUrgency: number }) {
  return (
    <div
      className="rounded border border-cyan-900/40 bg-slate-950/80 p-2"
      data-testid="executive-control-room-priority-surface"
    >
      <p className="text-[9px] uppercase tracking-[0.22em] text-cyan-200/80">Priorité stratégique</p>
      <p className="mt-1 font-mono text-lg text-cyan-100">{props.executiveUrgency}</p>
    </div>
  );
}

export function ExecutiveControlRoomHistorySurface(props: { signalCount: number }) {
  return (
    <div
      className="rounded border border-slate-800 bg-slate-950/80 p-2"
      data-testid="executive-control-room-history-surface"
    >
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Signaux exécutifs</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.signalCount}</p>
    </div>
  );
}

export function ExecutiveControlRoomSystemicSurface(props: { strategicBalanceScore: number }) {
  return (
    <div
      className="rounded border border-indigo-900/40 bg-slate-950/80 p-2"
      data-testid="executive-control-room-systemic-surface"
    >
      <p className="text-[9px] uppercase tracking-[0.22em] text-indigo-200/80">Équilibre stratégique</p>
      <p className="mt-1 font-mono text-lg text-indigo-100">{props.strategicBalanceScore}</p>
      <p className="text-[9px] text-slate-500">lecture supervision — pas exécution</p>
    </div>
  );
}
