"use client";

export function RelationshipGraphOverviewSurface(props: {
  headline: string;
  acceptedRelationshipCount: number;
  partnerOrganizationCount: number;
  concentrationIndex: number;
  coverageIndex: number;
  fragilityIndex: number;
  overviewExplanation: string;
}) {
  const {
    headline,
    acceptedRelationshipCount,
    partnerOrganizationCount,
    concentrationIndex,
    coverageIndex,
    fragilityIndex,
    overviewExplanation,
  } = props;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="crg-overview-surface">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Vue d’ensemble</h3>
      <p className="text-[12px] text-slate-100">{headline}</p>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-400 md:grid-cols-3">
        <div>
          <dt className="text-slate-500">Relations validées</dt>
          <dd className="font-mono text-cyan-100/90">{acceptedRelationshipCount}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Partenaires (orgs)</dt>
          <dd className="font-mono text-cyan-100/90">{partnerOrganizationCount}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Indices (0–1)</dt>
          <dd className="font-mono text-slate-200">
            conc. {concentrationIndex.toFixed(2)} · couv. {coverageIndex.toFixed(2)} · frag. {fragilityIndex.toFixed(2)}
          </dd>
        </div>
      </dl>
      <p className="mt-2 border-t border-slate-800/80 pt-2 text-[10px] leading-relaxed text-slate-500">{overviewExplanation}</p>
    </section>
  );
}
