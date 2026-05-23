"use client";

export function SovereigntyAutonomySurface(props: { sovereigntyScore: number; autonomyScore: number }) {
  const { sovereigntyScore, autonomyScore } = props;
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Souveraineté corridor</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{sovereigntyScore}</p>
      <p className="text-[9px] text-slate-400">Autonomie {autonomyScore}</p>
    </div>
  );
}

export function SovereigntyExposureSurface(props: { dependencyExposure: number; captivityRisk: number }) {
  const { dependencyExposure, captivityRisk } = props;
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2">
      <p className="text-[9px] uppercase tracking-[0.22em] text-amber-200/80">Exposition / captivité</p>
      <p className="mt-1 font-mono text-lg text-amber-100">{dependencyExposure}</p>
      <p className="text-[9px] text-slate-400">Captivité {captivityRisk}</p>
    </div>
  );
}

export function SovereigntyRecoverySurface(props: { selfRecoveryProbability: number }) {
  const { selfRecoveryProbability } = props;
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2">
      <p className="text-[9px] uppercase tracking-[0.22em] text-emerald-200/80">Auto-récupération</p>
      <p className="mt-1 font-mono text-lg text-emerald-100">{(selfRecoveryProbability * 100).toFixed(0)}%</p>
    </div>
  );
}

export function SovereigntyDashboardSurface(props: {
  corridorCount: number;
  aggregateSovereignty: number;
  aggregateAutonomy: number;
  calibrationProfile: string;
}) {
  const { corridorCount, aggregateSovereignty, aggregateAutonomy, calibrationProfile } = props;
  return (
    <div className="rounded border border-slate-700/60 bg-slate-950/90 p-3" data-testid="sovereignty-dashboard-surface">
      <p className="text-[9px] uppercase tracking-[0.24em] text-slate-300/90">Dashboard souveraineté agrégé</p>
      <p className="mt-2 font-mono text-xs text-slate-400">
        Corridors {corridorCount} · Souveraineté agrégée {aggregateSovereignty} · Autonomie calibrée{" "}
        {aggregateAutonomy}
      </p>
      <p className="mt-1 text-[9px] text-slate-500">
        Profil calibration {calibrationProfile} — lecture interne corridor, pas notation partenaire.
      </p>
    </div>
  );
}

export function CaptivityDistributionSurface(props: { captiveCount: number }) {
  return (
    <div className="rounded border border-amber-900/40 bg-slate-950/80 p-2" data-testid="captivity-distribution-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-amber-200/80">Captivité systémique</p>
      <p className="mt-1 font-mono text-lg text-amber-100">{props.captiveCount}</p>
      <p className="text-[9px] text-slate-500">corridors à risque captivité</p>
    </div>
  );
}

export function AutonomyDistributionSurface(props: {
  sampleSize: number;
  fallbackCorridors: number;
  confidenceLabel: string;
}) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="autonomy-distribution-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Distribution autonomie</p>
      <p className="mt-1 font-mono text-xs text-slate-300">
        Échantillon {props.sampleSize} · Fallback {props.fallbackCorridors}
      </p>
      <p className="text-[9px] text-slate-500">Confiance {props.confidenceLabel}</p>
    </div>
  );
}

export function DependencyConcentrationSurface(props: { meanConcentration: number; meanExternal: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="dependency-concentration-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-200/80">Concentration dépendances</p>
      <p className="mt-1 font-mono text-lg text-slate-100">{props.meanConcentration}</p>
      <p className="text-[9px] text-slate-400">Exposition externe moyenne {props.meanExternal}</p>
    </div>
  );
}

export function SystemicExposureSurface(props: { territoryKeys: number; sectorKeys: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/80 p-2" data-testid="systemic-exposure-surface">
      <p className="text-[9px] uppercase tracking-[0.22em] text-rose-200/70">Exposition systémique</p>
      <p className="mt-1 text-[9px] text-slate-400">
        Territoires {props.territoryKeys} · Secteurs {props.sectorKeys}
      </p>
    </div>
  );
}

export function SovereigntyScoreLabels(props: {
  rawScore: number;
  calibratedScore: number;
  fallbackUsed: boolean;
  confidenceLevel: string;
}) {
  return (
    <p className="text-[9px] text-slate-500" data-testid="sovereignty-score-labels">
      Score réel {props.rawScore} · calibré {props.calibratedScore}
      {props.fallbackUsed ? " · fallback heuristique" : ""} · confiance {props.confidenceLevel}
    </p>
  );
}
