"use client";

import type { RelationalCatalogViewerRole, RelationalOrderDiagnostics } from "@venext/shared-contracts";

const SCOPE_COPY: Record<RelationalCatalogViewerRole, string> = {
  INDUSTRIAL_PRODUCER: "Producteur — commandes corridor aval (partenaires en aval sur relations acceptées).",
  PRODUCER: "Producteur — commandes corridor aval (partenaires en aval sur relations acceptées).",
  WHOLESALER:
    "Grossiste — commandes fournisseurs et clients sur arêtes incidentes acceptées (double face corridor).",
  RETAILER: "Détaillant — commandes fournisseurs directs ; pas de réseau élargi hors corridor.",
  ADMIN_VIEWER: "Admin — voisins sur arêtes incidentes uniquement ; pas de lecture globale multi-réseau.",
  UNKNOWN_COMMERCIAL_VIEWER: "Profil inconnu — périmètre restreint à votre organisation seule.",
};

export function RelationshipScopeSurface(props: {
  viewerRole: RelationalCatalogViewerRole;
  relationshipScopeMode: string;
  diagnostics: RelationalOrderDiagnostics;
}) {
  const d = props.diagnostics;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-orders-relationship-scope">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">Portée relationnelle</h3>
      <p className="text-[10px] text-slate-400">{SCOPE_COPY[props.viewerRole]}</p>
      <p className="mt-2 font-mono text-[9px] text-cyan-100/80" data-testid="relational-orders-scope-mode">
        relationshipScopeMode={props.relationshipScopeMode}
      </p>
      <div
        className="mt-2 rounded border border-cyan-900/35 bg-cyan-950/15 px-2 py-1.5 text-[9px] text-slate-300"
        data-testid="relational-orders-catalog-order-scope-contrast"
      >
        <p className="font-mono text-[9px] text-cyan-100/85" data-testid="relational-orders-order-scope-mode">
          orderScopeMode={d.orderScopeMode}
        </p>
        <p className="mt-1 font-mono text-[8px] leading-snug text-slate-400" data-testid="relational-orders-catalog-scope-contrast">
          catalogScopeContrast={d.catalogScopeContrast}
        </p>
        <p className="mt-1.5 text-[9px] leading-relaxed text-slate-400">{d.scopeExplanation}</p>
      </div>
    </section>
  );
}
