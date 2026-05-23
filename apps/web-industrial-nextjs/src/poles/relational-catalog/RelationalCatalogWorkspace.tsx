"use client";

import type { RelationalCatalogResponse } from "@venext/shared-contracts";

import { RelationalCatalogDiagnosticsSurface } from "./surfaces/RelationalCatalogDiagnosticsSurface";
import { RelationalCatalogProductsSurface } from "./surfaces/RelationalCatalogProductsSurface";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

export function RelationalCatalogWorkspace(props: {
  data: RelationalCatalogResponse | null;
  loading: boolean;
  error: string | null;
  viewerOrganizationId: string;
  directCatalogEnabled: boolean;
  actingUserId?: string;
}) {
  const { data, loading, error, viewerOrganizationId, directCatalogEnabled, actingUserId } = props;
  if (loading) {
    return <VenextInlineSkeleton />;
  }
  if (error) {
    return (
      <p className="px-4 py-6 text-xs text-amber-200/90" data-testid="relational-catalog-workspace-error">
        {error}
      </p>
    );
  }
  if (!data?.snapshot) {
    return <p className="px-4 py-6 text-xs text-slate-500">Aucun agrégat catalogue disponible.</p>;
  }
  const snap = data.snapshot;
  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-auto px-3 py-3 pb-24">
      <header className="rounded border border-emerald-900/50 bg-slate-950/90 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-200/90">Catalogues relationnels</p>
        <p className="mt-1 text-[10px] text-slate-500">
          Politique <span className="font-mono">{data.policy}</span> · rôle observateur{" "}
          <span className="font-mono">{snap.viewerRole}</span>
        </p>
        <p className="mt-1 text-[10px] text-slate-500">
          Page courante : catalogues <span className="font-mono">{snap.accessibleCatalogs.length}</span> · produits{" "}
          <span className="font-mono">{snap.accessibleProducts.length}</span> · injections alignées{" "}
          <span className="font-mono">{snap.sponsoredInsertions.length}</span> (troncature possible — voir diagnostics)
        </p>
      </header>
      <div className="grid gap-3 lg:grid-cols-2">
        <RelationalCatalogDiagnosticsSurface diagnostics={snap.catalogDiagnostics} viewerRole={snap.viewerRole} />
        <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-catalog-intelligence-panel">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">Intelligence (symbolique)</h3>
          <p className="text-[10px] text-slate-400">{snap.catalogIntelligence.intelligenceExplanation}</p>
          <p className="mt-2 text-[9px] text-amber-200/85">
            proxyDerived={String(snap.catalogIntelligence.proxyDerived)} — les champs *Proxy ne sont pas des métriques métier
            certifiées.
          </p>
          <ul className="mt-1 list-inside list-disc text-[9px] text-slate-500">
            {snap.catalogIntelligence.proxyInputs.slice(0, 12).map((x) => (
              <li key={x} className="font-mono">
                {x}
              </li>
            ))}
          </ul>
          <ul className="mt-2 grid gap-1 text-[10px] text-slate-500 md:grid-cols-2">
            <li>Couverture relations : {snap.catalogIntelligence.relationshipCoverage.toFixed(2)}</li>
            <li>Densité catalogues : {snap.catalogIntelligence.catalogDensity.toFixed(2)}</li>
            <li>Pression dépendance : {snap.catalogIntelligence.dependencyPressure.toFixed(2)}</li>
            <li>Saturation sponsor : {snap.catalogIntelligence.sponsorSaturation.toFixed(2)}</li>
            <li className="md:col-span-2 text-slate-600">
              isolatedRetailersProxy / concentratedWholesalersProxy : bornes heuristiques — ne pas lire comme comptages
              terrain.
            </li>
          </ul>
        </section>
      </div>
      <RelationalCatalogProductsSurface
        products={snap.accessibleProducts}
        viewerOrganizationId={viewerOrganizationId}
        directCatalogEnabled={directCatalogEnabled}
        actingUserId={actingUserId}
      />
      <footer className="rounded border border-slate-800/80 bg-black/30 px-2 py-2 text-[9px] text-slate-500">
        Restrictions : {snap.relationalRestrictions.join(" · ")}
      </footer>
    </div>
  );
}
