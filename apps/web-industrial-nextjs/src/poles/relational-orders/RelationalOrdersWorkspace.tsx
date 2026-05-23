"use client";

import type { RelationalOrdersResponse } from "@venext/shared-contracts";

import { RelationalOrdersCorridorSurface } from "./surfaces/RelationalOrdersCorridorSurface";
import { RelationalOrdersDiagnosticsSurface } from "./surfaces/RelationalOrdersDiagnosticsSurface";
import { RelationalOrderStatesSurface } from "./surfaces/RelationalOrderStatesSurface";
import { RelationshipScopeSurface } from "./surfaces/RelationshipScopeSurface";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

export function RelationalOrdersWorkspace(props: {
  data: RelationalOrdersResponse | null;
  loading: boolean;
  error: string | null;
  loadNextPage?: () => void | Promise<void>;
  loadingMore?: boolean;
  appliedStatus?: string;
  appliedRelationshipId?: string;
}) {
  const { data, loading, error, loadNextPage, loadingMore, appliedStatus, appliedRelationshipId } = props;
  if (loading) {
    return <VenextInlineSkeleton variant="orders" />;
  }
  if (error) {
    return (
      <p className="px-4 py-6 text-xs text-amber-200/90" data-testid="relational-orders-workspace-error">
        {error}
      </p>
    );
  }
  if (!data?.snapshot) {
    return <p className="px-4 py-6 text-xs text-slate-500">Aucun agrégat commandes disponible.</p>;
  }
  const snap = data.snapshot;
  const d = snap.diagnostics;
  const canLoadMore = Boolean(d.nextOrderCursor) && data.policy === "ACTIVE";
  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-auto px-3 py-3 pb-24">
      <header className="rounded border border-cyan-900/40 bg-slate-950/90 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/90">Commandes relationnelles</p>
        <p className="mt-1 text-[10px] text-slate-500">
          Politique <span className="font-mono">{data.policy}</span> · rôle observateur{" "}
          <span className="font-mono">{snap.viewerRole}</span>
        </p>
        <p className="mt-1 text-[10px] text-slate-500" data-testid="relational-orders-pagination-summary">
          Commandes affichées : <span className="font-mono">{snap.orders.length}</span> · tronqué{" "}
          <span className="font-mono">{String(d.ordersTruncated)}</span> · limite{" "}
          <span className="font-mono">{d.ordersLimit}</span>
        </p>
        {appliedStatus || appliedRelationshipId ? (
          <p className="mt-1 text-[9px] text-slate-500" data-testid="relational-orders-active-filters">
            Filtres API :{" "}
            {appliedStatus ? (
              <span className="font-mono">
                status={appliedStatus}
              </span>
            ) : null}
            {appliedStatus && appliedRelationshipId ? " · " : null}
            {appliedRelationshipId ? (
              <span className="font-mono">relationshipId={appliedRelationshipId.slice(0, 8)}…</span>
            ) : null}
          </p>
        ) : null}
        {d.requestedStatusUnsupported ? (
          <p className="mt-1 text-[9px] text-amber-200/90" data-testid="relational-orders-status-unsupported">
            Filtre demandé non disponible pour le moment (expiration : source non branchée).
          </p>
        ) : null}
        <p className="mt-1 text-[9px] text-slate-500" data-testid="relational-orders-pagination-api-note">
          Pagination keyset côté API (curseur <span className="font-mono">orderCursor</span>) — navigation avancée UI
          partielle ci-dessous.
        </p>
        <p className="mt-1 text-[9px] font-mono text-slate-400" data-testid="relational-orders-next-cursor-display">
          nextOrderCursor={d.nextOrderCursor ?? "null"}
        </p>
        {canLoadMore && loadNextPage ? (
          <button
            type="button"
            className="mt-2 rounded border border-cyan-800/80 bg-cyan-950/40 px-2 py-1 text-[10px] text-cyan-100/90 disabled:opacity-50"
            disabled={loadingMore}
            onClick={() => void loadNextPage()}
            data-testid="relational-orders-load-next"
          >
            {loadingMore ? "Suite en cours…" : "Charger page suivante"}
          </button>
        ) : null}
      </header>
      <div className="grid gap-3 lg:grid-cols-2">
        <RelationalOrdersDiagnosticsSurface diagnostics={snap.diagnostics} />
        <RelationshipScopeSurface
          viewerRole={snap.viewerRole}
          relationshipScopeMode={snap.diagnostics.viewerScopeMode}
          diagnostics={snap.diagnostics}
        />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <RelationalOrderStatesSurface />
        <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-orders-signals-panel">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">Signaux consultatifs</h3>
          <p className="text-[10px] text-slate-400">
            Types réservés / non branchés listés dans les diagnostics — pas autopilot commercial.
          </p>
        </section>
      </div>
      <RelationalOrdersCorridorSurface orders={snap.orders} />
      <footer className="rounded border border-slate-800/80 bg-black/30 px-2 py-2 text-[9px] text-slate-500">
        Couche 20.0 — orchestration corridor privée ; pas checkout public, pas panier multi-vendeurs, pas tarification marketplace
        sur ce contrat.
      </footer>
    </div>
  );
}
