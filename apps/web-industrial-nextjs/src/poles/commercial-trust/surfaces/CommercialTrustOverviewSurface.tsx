import type { CommercialTrustProfileResponseDto } from "@venext/shared-contracts";

export function CommercialTrustOverviewSurface({
  data,
}: {
  data: CommercialTrustProfileResponseDto | null;
}) {
  if (!data) return <p className="text-xs text-slate-500">Aucune lecture corridor disponible.</p>;
  const { profile, visibility } = data;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Lecture relationnelle</h2>
      <dl className="mt-3 grid gap-2 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Niveau interne</dt>
          <dd className="font-mono text-emerald-200/90">{profile.trustLevel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Indicateur agrégé (privé)</dt>
          <dd className="font-mono text-slate-300">{profile.trustScore.toFixed(1)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Visibilité</dt>
          <dd className="font-mono text-slate-400">{visibility.visibilityScope}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
        Indicateur interne borné — pas de classement public, pas de réputation marketplace ouverte.
      </p>
    </section>
  );
}
