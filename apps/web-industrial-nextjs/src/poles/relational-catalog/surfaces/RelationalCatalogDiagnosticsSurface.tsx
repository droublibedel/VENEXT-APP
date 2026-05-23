"use client";

import type { RelationalCatalogDiagnostics, RelationalCatalogViewerRole } from "@venext/shared-contracts";

const VIEWER_SCOPE_COPY: Record<RelationalCatalogViewerRole, string> = {
  INDUSTRIAL_PRODUCER: "Producteur — réseau aval validé (catalogues partenaires en aval contractuel).",
  PRODUCER: "Producteur — réseau aval validé (catalogues partenaires en aval contractuel).",
  WHOLESALER: "Grossiste — fournisseurs validés (amont) ; pas de lecture des catalogues aval sur cette route.",
  RETAILER: "Détaillant — fournisseurs directs validés ; pas d’aval ni hors corridor.",
  ADMIN_VIEWER: "Admin — voisins sur arêtes incidentes uniquement ; pas de broad read réseau entier.",
  UNKNOWN_COMMERCIAL_VIEWER: "Profil inconnu — périmètre restreint à votre organisation seule.",
};

export function RelationalCatalogDiagnosticsSurface(props: {
  diagnostics: RelationalCatalogDiagnostics;
  viewerRole: RelationalCatalogViewerRole;
}) {
  const d = props.diagnostics;
  const partnerLine =
    d.partnerSource === "GRAPH_BUNDLE"
      ? "Corridor partenaires : bundle graphe 19.1A actif (arêtes validées incidentes)."
      : "Corridor partenaires : repli Prisma borné (graphe 19.1A indisponible pour cette org).";

  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-catalog-diagnostics">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">Diagnostics portée</h3>

      <div
        className="mb-3 rounded border border-slate-800/80 bg-black/25 px-2 py-2 text-[10px] text-slate-300"
        data-testid="relational-catalog-viewer-scope"
      >
        <p className="font-semibold text-slate-200">Portée observateur (viewer scope)</p>
        <p className="mt-1 text-slate-400">{VIEWER_SCOPE_COPY[props.viewerRole]}</p>
        <p className="mt-1 font-mono text-[9px] text-cyan-100/80">roleScopeMode={d.roleScopeMode}</p>
      </div>

      <p
        className="mb-2 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1.5 text-[9px] text-amber-100/90"
        data-testid="relational-catalog-heuristic-warning"
      >
        Signaux catalogue : <strong>heuristiques et symboliques uniquement</strong> — pas de tendance, d’appétit marché ni
        de demande mesurée hors données comportementales réelles.
      </p>

      <p
        className="mb-3 rounded border border-slate-700/60 bg-slate-900/40 px-2 py-1.5 text-[9px] text-slate-300"
        data-testid="relational-catalog-availability-warning"
      >
        Disponibilités : <strong>statuts Prisma symboliques</strong> — pas de stock temps réel, pas d’engagement logistique.
      </p>

      <ul className="grid gap-1 text-[10px] text-slate-400 md:grid-cols-2">
        <li className="md:col-span-2">{partnerLine}</li>
        <li>
          Source partenaires : <span className="font-mono text-slate-200">{d.partnerSource}</span> · fallback{" "}
          <span className="font-mono">{String(d.fallbackUsed)}</span> · voisins graphe{" "}
          <span className="font-mono">{d.graphPartnerCount}</span>
        </li>
        <li>
          Visibilité : <span className="font-mono text-slate-200">{d.visibilityPolicy}</span> · exposition catalogues{" "}
          <span className="font-mono text-slate-200">{d.catalogExposureMode}</span>
        </li>
        <li>
          Curseurs : <span className="font-mono text-slate-200">{d.cursorStrategy}</span> · signaux{" "}
          <span className="font-mono">{String(d.signalHeuristicOnly)}</span> (heuristique)
        </li>
        <li>
          Admin broad read : <span className="font-mono text-slate-200">{String(d.adminBroadReadSupported)}</span>{" "}
          (non supporté)
        </li>
        <li>
          Sponsor : global bloqué <span className="font-mono">{String(d.sponsorGlobalInjectionBlocked)}</span> · scope
          relationnel requis <span className="font-mono">{String(d.sponsorRequiresRelationshipScope)}</span>
        </li>
        <li>
          Marketplace publique désactivée :{" "}
          <span className="font-mono text-slate-200">{String(d.publicMarketplaceDisabled)}</span> (attendu: true)
        </li>
        <li>
          Découverte publique désactivée :{" "}
          <span className="font-mono text-slate-200">{String(d.publicDiscoveryDisabled)}</span> (attendu: true)
        </li>
        <li>
          Commerce social désactivé : <span className="font-mono text-slate-200">{String(d.socialCommerceDisabled)}</span>{" "}
          (attendu: true)
        </li>
        <li>
          Relations validées uniquement : <span className="font-mono text-slate-200">{String(d.validatedRelationshipOnly)}</span>
        </li>
        <li>
          Catalogues relationship-scoped : <span className="font-mono text-slate-200">{String(d.relationshipScopedCatalogs)}</span>
        </li>
        <li>
          Pagination : <span className="font-mono text-slate-200">{String(d.paginationSupported)}</span> · produits tronqués{" "}
          <span className="font-mono">{String(d.productsTruncated)}</span> · catalogues tronqués{" "}
          <span className="font-mono">{String(d.catalogsTruncated)}</span>
        </li>
        <li className="md:col-span-2">
          nextCatalogCursor :{" "}
          <span className="break-all font-mono text-[9px] text-emerald-100/85">{d.nextCatalogCursor ?? "—"}</span>
        </li>
        <li className="md:col-span-2">
          nextProductCursor :{" "}
          <span className="break-all font-mono text-[9px] text-emerald-100/85">{d.nextProductCursor ?? "—"}</span>
        </li>
        <li className="md:col-span-2">
          Graphe réutilisé : <span className="break-all font-mono text-[9px] text-cyan-100/90">{d.graphReuse}</span>
        </li>
        <li>
          snapshotSource : <span className="break-all font-mono text-[9px] text-slate-300">{d.snapshotSource}</span>
        </li>
        <li>
          Mode dégradé : <span className="font-mono">{String(d.degradedMode)}</span> · poids{" "}
          <span className="font-mono">{d.payloadWeightClass}</span>
        </li>
      </ul>
    </section>
  );
}
