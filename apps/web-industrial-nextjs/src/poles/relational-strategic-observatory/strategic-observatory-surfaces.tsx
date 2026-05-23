"use client";

export function StrategicObservatoryOverviewSurface(props: { observatoryScore: number; resilienceStrength: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="strategic-observatory-overview-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Score synthèse exécutive</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.observatoryScore}</p>
      <p className="text-[9px] text-slate-400">Résilience {props.resilienceStrength}</p>
    </div>
  );
}

export function StrategicObservatoryGridSurface(props: { gridCount: number }) {
  return (
    <div className="rounded border border-violet-900/40 bg-slate-950/80 p-2" data-testid="strategic-observatory-grid-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-violet-200/80">Grids stratégiques</p>
      <p className="mt-1 font-mono text-lg text-violet-100">{props.gridCount}</p>
      <p className="text-[9px] text-slate-500">templates déterministes — pas IA</p>
    </div>
  );
}

export function StrategicObservatoryPressureSurface(props: {
  executiveExposure: number;
  systemicPressure: number;
}) {
  return (
    <div className="rounded border border-rose-900/40 bg-slate-950/80 p-2" data-testid="strategic-observatory-pressure-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-rose-200/80">Exposition exécutive</p>
      <p className="mt-1 font-mono text-lg text-rose-100">{props.executiveExposure}</p>
      <p className="text-[9px] text-slate-400">Pression systémique {props.systemicPressure}</p>
    </div>
  );
}

export function StrategicObservatoryPrioritySurface(props: { executiveUrgency: number }) {
  return (
    <div className="rounded border border-cyan-900/40 bg-slate-950/80 p-2" data-testid="strategic-observatory-priority-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-cyan-200/80">Priorité consolidée</p>
      <p className="mt-1 font-mono text-lg text-cyan-100">{props.executiveUrgency}</p>
    </div>
  );
}

export function StrategicObservatoryHistorySurface(props: { signalCount: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="strategic-observatory-history-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Signaux consolidés</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.signalCount}</p>
    </div>
  );
}

export function StrategicObservatorySystemicSurface(props: { strategicAlignmentScore: number }) {
  return (
    <div className="rounded border border-indigo-900/40 bg-slate-950/80 p-2" data-testid="strategic-observatory-systemic-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-indigo-200/80">Alignement stratégique</p>
      <p className="mt-1 font-mono text-lg text-indigo-100">{props.strategicAlignmentScore}</p>
      <p className="text-[9px] text-slate-500">supervision globale — pas exécution</p>
    </div>
  );
}
