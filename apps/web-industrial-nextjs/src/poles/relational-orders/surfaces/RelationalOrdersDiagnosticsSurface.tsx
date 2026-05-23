"use client";

import type { RelationalOrderDiagnostics } from "@venext/shared-contracts";

function readinessList(entries: Record<string, string>): string {
  return Object.entries(entries)
    .map(([k, v]) => `${k}=${v}`)
    .join(" · ");
}

export function RelationalOrdersDiagnosticsSurface(props: { diagnostics: RelationalOrderDiagnostics }) {
  const d = props.diagnostics;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-orders-diagnostics">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">Diagnostics honnêteté</h3>
      <p
        className="mb-2 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1.5 text-[9px] text-amber-100/90"
        data-testid="relational-orders-heuristic-warning"
      >
        Signaux commande : <strong>heuristiques et symboliques uniquement</strong> — pas d’optimisation commerciale, pas de
        prévision de demande revendiquée.
      </p>
      <ul className="grid gap-1 text-[10px] text-slate-400 md:grid-cols-2">
        <li>
          Paiement intégré : <span className="font-mono">{String(d.paymentNotIntegrated)}</span> (attendu: true)
        </li>
        <li>
          Logistique temps réel : <span className="font-mono">{String(d.logisticsRealtimeDisabled)}</span> (attendu: true)
        </li>
        <li>
          Marketplace publique : <span className="font-mono">{String(d.publicMarketplaceDisabled)}</span> (attendu: true)
        </li>
        <li>
          Découverte publique : <span className="font-mono">{String(d.publicDiscoveryDisabled)}</span> (attendu: true)
        </li>
        <li>
          Portée relations : <span className="font-mono">{String(d.relationshipScopedOnly)}</span> (attendu: true)
        </li>
        <li>
          Fulfillment symbolique : <span className="font-mono">{String(d.symbolicFulfillmentOnly)}</span> (attendu: true)
        </li>
        <li className="md:col-span-2">
          Source vérité : <span className="font-mono text-slate-200">{d.sourceOfTruth}</span> · snapshot{" "}
          <span className="font-mono text-slate-200">{d.snapshotSource}</span>
        </li>
        <li className="md:col-span-2">
          Graphe : <span className="font-mono text-slate-200">{d.graphReuse.slice(0, 120)}</span>
        </li>
        <li>
          Partenaires : <span className="font-mono">{d.partnerSource}</span> · fallback{" "}
          <span className="font-mono">{String(d.fallbackUsed)}</span>
        </li>
        <li>
          Curseur : <span className="font-mono text-slate-200">{d.nextOrderCursor ?? "null"}</span> · tronqué{" "}
          <span className="font-mono">{String(d.ordersTruncated)}</span> · limite{" "}
          <span className="font-mono">{d.ordersLimit}</span>
        </li>
        <li className="md:col-span-2">
          Validation direction relation :{" "}
          <span className="font-mono">{String(d.relationshipDirectionValidated)}</span> · rejets direction{" "}
          <span className="font-mono">{d.rejectedByRelationshipDirectionCount}</span>
        </li>
        <li className="md:col-span-2">
          Types commande émis : <span className="font-mono text-slate-200">{d.emittedOrderTypes.join(", ") || "—"}</span> ·
          non branchés : <span className="font-mono text-slate-200">{d.unavailableOrderTypes.join(", ") || "—"}</span>
        </li>
        <li className="md:col-span-2 text-[9px] leading-snug" data-testid="relational-orders-order-type-readiness">
          Types préparés (readiness) : <span className="font-mono text-slate-300">{readinessList(d.orderTypeReadiness)}</span>
        </li>
        <li className="md:col-span-2">
          Signaux émis : <span className="font-mono text-slate-200">{d.emittedSignalTypes.join(", ") || "—"}</span> ·
          réservés / absents page :{" "}
          <span className="font-mono text-slate-200">{d.unavailableSignalTypes.join(", ") || "—"}</span>
        </li>
        <li className="md:col-span-2 text-[9px] leading-snug" data-testid="relational-orders-signal-readiness">
          Signaux (readiness) : <span className="font-mono text-slate-300">{readinessList(d.signalReadiness)}</span>
        </li>
        <li className="md:col-span-2">
          Statuts émis (page) : <span className="font-mono text-slate-200">{d.emittedStatuses.join(", ") || "—"}</span> · hors
          mapping Prisma : <span className="font-mono text-slate-200">{d.unavailableStatuses.join(", ") || "—"}</span>
        </li>
        <li className="md:col-span-2 text-[9px] leading-snug" data-testid="relational-orders-status-readiness">
          Statuts (readiness) : <span className="font-mono text-slate-300">{readinessList(d.statusReadiness)}</span>
        </li>
        <li className="md:col-span-2">
          Filtre status non supporté aujourd’hui :{" "}
          <span className="font-mono">{String(d.requestedStatusUnsupported)}</span>
        </li>
        <li
          className="md:col-span-2 rounded border border-slate-800/80 bg-black/25 px-2 py-1 text-[9px] text-slate-400"
          data-testid="relational-orders-catalog-policy-note"
        >
          Lignes commande : visibilité catalogue{" "}
          <span className="font-mono text-slate-300">{String(d.catalogVisibilityRevalidated)}</span> (non recalculée ligne à
          ligne) · références historiques OrderItem/Product :{" "}
          <span className="font-mono text-slate-300">{String(d.orderLinesUseHistoricalOrderItems)}</span> · source{" "}
          <span className="font-mono text-slate-200">{d.catalogPolicySource}</span>
        </li>
      </ul>
    </section>
  );
}
