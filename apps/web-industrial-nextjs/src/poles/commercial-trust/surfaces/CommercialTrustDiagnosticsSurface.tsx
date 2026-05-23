import type { CommercialTrustProfileResponseDto } from "@venext/shared-contracts";

export function CommercialTrustDiagnosticsSurface({
  data,
}: {
  data: CommercialTrustProfileResponseDto | null;
}) {
  const d = data?.diagnostics;
  if (!d) return <p className="text-xs text-slate-500">Diagnostics indisponibles.</p>;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Diagnostics honnêtes</h2>
      <ul className="mt-3 space-y-1 text-[10px] text-slate-400">
        <li>Couche confiance économique privée : {d.privateEconomicTrustLayer ? "oui" : "non"}</li>
        <li>Exposition marketplace publique : {d.publicMarketplaceExposure ? "oui" : "non"}</li>
        <li>Classement public désactivé : {d.publicRankingDisabled ? "oui" : "non"}</li>
        <li>Scoring social désactivé : {d.socialScoringDisabled ? "oui" : "non"}</li>
        <li>Source calcul : {d.computationSource}</li>
        <li>Mode : {d.computationMode}</li>
        <li>Complétude données : {(d.dataCompleteness * 100).toFixed(0)}%</li>
        <li>Prêt incrémental : {d.incrementalReady ? "oui" : "non"}</li>
        <li>Dernière mise à jour : {d.lastComputedAt ?? "—"}</li>
        <li>Acteur obligatoire (API) : {d.actorRequired ? "oui" : "non"}</li>
        <li>Accès anonyme : {d.anonymousAccessAllowed ? "oui" : "non"}</li>
        <li>Visibilité appliquée : {d.visibilityEnforcedAt}</li>
      </ul>
    </section>
  );
}
