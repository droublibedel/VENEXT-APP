"use client";

export function CoverageModelSurface(props: {
  relationshipDensity: number;
  distributionCoverage: number;
  upstreamCoverage: number;
  downstreamCoverage: number;
  isolatedAreas: string[];
  coverageGaps: string[];
  coverageExplanation: string;
}) {
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="crg-coverage-surface">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Couverture symbolique</h3>
      <p className="mb-2 text-[9px] text-slate-500">Territoires et mailles — libellés symboliques, pas de carte réelle.</p>
      <dl className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
        <div>
          <dt className="text-slate-500">Densité relationnelle</dt>
          <dd className="font-mono">{props.relationshipDensity.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Couverture distribution</dt>
          <dd className="font-mono">{props.distributionCoverage.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Couverture amont / aval</dt>
          <dd className="font-mono">
            {props.upstreamCoverage.toFixed(2)} / {props.downstreamCoverage.toFixed(2)}
          </dd>
        </div>
      </dl>
      {props.isolatedAreas.length ? (
        <p className="mt-2 text-[9px] text-slate-500">Zones isolées : {props.isolatedAreas.join(" · ")}</p>
      ) : null}
      {props.coverageGaps.length ? (
        <p className="mt-2 text-[9px] text-amber-200/80">Trous : {props.coverageGaps.join(" · ")}</p>
      ) : null}
      <p className="mt-2 border-t border-slate-800/80 pt-2 text-[9px] text-slate-500">{props.coverageExplanation}</p>
    </section>
  );
}
