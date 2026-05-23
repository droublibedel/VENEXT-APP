import type { CommercialCorridorProfileDto } from "@venext/shared-contracts";

export function CorridorOverviewSurface({ data }: { data: CommercialCorridorProfileDto | null }) {
  if (!data) return <p className="text-xs text-slate-500">Aucun profil corridor chargé.</p>;

  const scope = data.diagnostics.relationshipIntelligenceScope;
  const showBackofficeInternalNumeric =
    scope === "RELATIONSHIP_BACKOFFICE_FULL" && data.corridorHealthNumeric != null;

  return (
    <section className="rounded border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Centre intelligence corridor</h2>
      <dl className="mt-3 grid gap-2 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">État corridor</dt>
          <dd className="font-mono text-violet-200/90">{data.corridorState}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Bande agrégée (privée)</dt>
          <dd className="font-mono text-slate-300">{data.corridorHealthBand}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Lecture agrégée</dt>
          <dd className="font-mono text-slate-300">
            {showBackofficeInternalNumeric ? (
              <span>
                Indice interne non public (salle de contrôle uniquement)&nbsp;: {data.corridorHealthNumeric}
              </span>
            ) : (
              <span>
                Chiffre exact masqué pour les espaces partenaire et privé — bande et diagnostics qualitatifs
                seulement.
              </span>
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Visibilité corridor</dt>
          <dd className="font-mono text-slate-400">{data.corridorVisibilityLevel}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
        Lecture gouvernance relationnelle — pas de vitrine marketplace, pas de classement public entre partenaires.
      </p>
    </section>
  );
}
