"use client";

export function MonitoringOverviewSurface(props: { monitoringScore: number; resilienceLevel: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="monitoring-overview-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Supervision exécutive</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.monitoringScore}</p>
      <p className="text-[9px] text-slate-400">Résilience {props.resilienceLevel}</p>
    </div>
  );
}

export function MonitoringAlertSurface(props: { alertCount: number }) {
  return (
    <div className="rounded border border-amber-900/40 bg-slate-950/80 p-2" data-testid="monitoring-alert-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-amber-200/80">Alertes stratégiques</p>
      <p className="mt-1 font-mono text-lg text-amber-100">{props.alertCount}</p>
    </div>
  );
}

export function MonitoringPressureSurface(props: { executivePressure: number; systemicRisk: number }) {
  return (
    <div className="rounded border border-rose-900/40 bg-slate-950/80 p-2" data-testid="monitoring-pressure-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-rose-200/80">Pression exécutive / risque</p>
      <p className="mt-1 font-mono text-lg text-rose-100">{props.executivePressure}</p>
      <p className="text-[9px] text-slate-400">Systémique {props.systemicRisk}</p>
    </div>
  );
}

export function MonitoringPrioritySurface(props: { executiveUrgency: number }) {
  return (
    <div className="rounded border border-cyan-900/40 bg-slate-950/80 p-2" data-testid="monitoring-priority-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-cyan-200/80">Urgence exécutive</p>
      <p className="mt-1 font-mono text-lg text-cyan-100">{props.executiveUrgency}</p>
    </div>
  );
}

export function MonitoringHistorySurface(props: { signalCount: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="monitoring-history-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Signaux supervision</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.signalCount}</p>
    </div>
  );
}

export function MonitoringSystemicSurface(props: { coordinationPressure: number }) {
  return (
    <div className="rounded border border-violet-900/40 bg-slate-950/80 p-2" data-testid="monitoring-systemic-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-violet-200/80">Coordination inter-pôles</p>
      <p className="mt-1 font-mono text-lg text-violet-100">{props.coordinationPressure}</p>
      <p className="text-[9px] text-slate-500">lecture directionnelle — pas exécution</p>
    </div>
  );
}
