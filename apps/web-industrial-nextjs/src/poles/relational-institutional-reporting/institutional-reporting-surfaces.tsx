"use client";

export function InstitutionalReportingOverviewSurface(props: {
  institutionalScore: number;
  strategicResilience: number;
}) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="institutional-reporting-overview-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Score institutionnel</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.institutionalScore}</p>
      <p className="text-[9px] text-slate-400">Résilience {props.strategicResilience}</p>
    </div>
  );
}

export function InstitutionalReportingBriefSurface(props: { briefCount: number }) {
  return (
    <div className="rounded border border-amber-900/40 bg-slate-950/80 p-2" data-testid="institutional-reporting-brief-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-amber-200/80">Briefs structurés</p>
      <p className="mt-1 font-mono text-lg text-amber-100">{props.briefCount}</p>
      <p className="text-[9px] text-slate-500">templates déterministes — pas IA</p>
    </div>
  );
}

export function InstitutionalReportingPressureSurface(props: { executiveRisk: number; systemicExposure: number }) {
  return (
    <div className="rounded border border-rose-900/40 bg-slate-950/80 p-2" data-testid="institutional-reporting-pressure-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-rose-200/80">Risque exécutif / exposition</p>
      <p className="mt-1 font-mono text-lg text-rose-100">{props.executiveRisk}</p>
      <p className="text-[9px] text-slate-400">Systémique {props.systemicExposure}</p>
    </div>
  );
}

export function InstitutionalReportingPrioritySurface(props: { executiveUrgency: number }) {
  return (
    <div className="rounded border border-cyan-900/40 bg-slate-950/80 p-2" data-testid="institutional-reporting-priority-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-cyan-200/80">Urgence institutionnelle</p>
      <p className="mt-1 font-mono text-lg text-cyan-100">{props.executiveUrgency}</p>
    </div>
  );
}

export function InstitutionalReportingHistorySurface(props: { signalCount: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="institutional-reporting-history-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Signaux reporting</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.signalCount}</p>
    </div>
  );
}

export function InstitutionalReportingSystemicSurface(props: { strategicAlignmentScore: number }) {
  return (
    <div className="rounded border border-violet-900/40 bg-slate-950/80 p-2" data-testid="institutional-reporting-systemic-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-violet-200/80">Alignement stratégique</p>
      <p className="mt-1 font-mono text-lg text-violet-100">{props.strategicAlignmentScore}</p>
      <p className="text-[9px] text-slate-500">lecture institutionnelle — pas exécution</p>
    </div>
  );
}
