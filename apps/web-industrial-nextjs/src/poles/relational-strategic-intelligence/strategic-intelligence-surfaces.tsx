"use client";

export function StrategicIntelligenceOverviewSurface(props: {
  strategicIntelligenceScore: number;
  resilienceStrength: number;
}) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="strategic-intelligence-overview-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Score institutionnel</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.strategicIntelligenceScore}</p>
      <p className="text-[9px] text-slate-400">Résilience {props.resilienceStrength}</p>
    </div>
  );
}

export function StrategicIntelligenceSynthesisSurface(props: { synthesisCount: number }) {
  return (
    <div className="rounded border border-amber-900/40 bg-slate-950/80 p-2" data-testid="strategic-intelligence-brief-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-amber-200/80">Briefs structurés</p>
      <p className="mt-1 font-mono text-lg text-amber-100">{props.synthesisCount}</p>
      <p className="text-[9px] text-slate-500">templates déterministes — pas IA</p>
    </div>
  );
}

export function StrategicIntelligencePressureSurface(props: { executiveExposure: number; systemicConcentration: number }) {
  return (
    <div className="rounded border border-rose-900/40 bg-slate-950/80 p-2" data-testid="strategic-intelligence-pressure-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-rose-200/80">Risque exécutif / exposition</p>
      <p className="mt-1 font-mono text-lg text-rose-100">{props.executiveExposure}</p>
      <p className="text-[9px] text-slate-400">Systémique {props.systemicConcentration}</p>
    </div>
  );
}

export function StrategicIntelligencePrioritySurface(props: { executiveUrgency: number }) {
  return (
    <div className="rounded border border-cyan-900/40 bg-slate-950/80 p-2" data-testid="strategic-intelligence-priority-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-cyan-200/80">Urgence institutionnelle</p>
      <p className="mt-1 font-mono text-lg text-cyan-100">{props.executiveUrgency}</p>
    </div>
  );
}

export function StrategicIntelligenceHistorySurface(props: { signalCount: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="strategic-intelligence-history-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Signaux reporting</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.signalCount}</p>
    </div>
  );
}

export function StrategicIntelligenceSystemicSurface(props: { strategicAlignmentScore: number }) {
  return (
    <div className="rounded border border-violet-900/40 bg-slate-950/80 p-2" data-testid="strategic-intelligence-systemic-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-violet-200/80">Alignement stratégique</p>
      <p className="mt-1 font-mono text-lg text-violet-100">{props.strategicAlignmentScore}</p>
      <p className="text-[9px] text-slate-500">lecture institutionnelle — pas exécution</p>
    </div>
  );
}
