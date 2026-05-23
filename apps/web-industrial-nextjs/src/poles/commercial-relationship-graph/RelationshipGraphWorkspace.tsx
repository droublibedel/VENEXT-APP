"use client";

import type { CommercialRelationshipGraphBundle } from "@venext/shared-contracts";

import { RelationshipGraphLegend } from "./surfaces/RelationshipGraphLegend";
import { RelationshipGraphOverviewSurface } from "./surfaces/RelationshipGraphOverviewSurface";
import { RelationshipNodesSurface } from "./surfaces/RelationshipNodesSurface";
import { RelationshipEdgesSurface } from "./surfaces/RelationshipEdgesSurface";
import { RelationshipSignalsSurface } from "./surfaces/RelationshipSignalsSurface";
import { DependencyClustersSurface } from "./surfaces/DependencyClustersSurface";
import { CoverageModelSurface } from "./surfaces/CoverageModelSurface";
import { CommercialBridgesSurface } from "./surfaces/CommercialBridgesSurface";
import { RelationshipChainsSurface } from "./surfaces/RelationshipChainsSurface";

export function RelationshipGraphWorkspace(props: {
  bundle: CommercialRelationshipGraphBundle | null;
  loading: boolean;
  error: string | null;
}) {
  const { bundle, loading, error } = props;

  if (loading) {
    return <p className="px-4 py-6 text-xs text-slate-500">Matérialisation du graphe (bundle unique)…</p>;
  }
  if (error) {
    return (
      <p className="px-4 py-6 text-xs text-amber-200/90" data-testid="crg-workspace-error">
        {error}
      </p>
    );
  }
  if (!bundle?.snapshot) {
    return <p className="px-4 py-6 text-xs text-slate-500">Aucun agrégat graphe disponible.</p>;
  }

  const snap = bundle.snapshot;
  const overview = snap.overview;
  const diag = snap.diagnostics;
  const coverage = snap.coverage;

  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-auto px-3 py-3 pb-24">
      <RelationshipGraphLegend />

      <header className="rounded border border-cyan-900/50 bg-slate-950/90 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/90">Graphe relationnel commercial</p>
        <p className="mt-1 text-[10px] text-slate-500">
          Politique <span className="font-mono">{bundle.policy}</span> · <span className="font-mono">{diag.graphMode}</span> ·
          projection <span className="font-mono">{diag.payloadProjection}</span>
        </p>
        <p className="mt-1 text-[10px] text-slate-500">
          Portée observateur <span className="font-mono">{diag.viewerScope}</span>
          {diag.paginationSupported ? null : (
            <>
              {" "}
              · limite nœuds <span className="font-mono">{diag.nodesLimit}</span> · limite arêtes{" "}
              <span className="font-mono">{diag.edgesLimit}</span>
            </>
          )}
        </p>
        {(diag.nodesTruncated || diag.edgesTruncated) && (
          <p className="mt-2 rounded border border-amber-900/60 bg-amber-950/40 px-2 py-1.5 text-[10px] text-amber-100/95" data-testid="crg-truncation-banner">
            Sous-graphe tronqué (pagination non disponible) : nœuds tronqués{" "}
            <span className="font-mono">{String(diag.nodesTruncated)}</span>, arêtes tronquées{" "}
            <span className="font-mono">{String(diag.edgesTruncated)}</span>.
          </p>
        )}
        {(diag.summaryProjectionOmitsChains || diag.summaryProjectionClustersCapped) && (
          <p className="mt-2 rounded border border-cyan-900/40 bg-slate-900/50 px-2 py-1.5 text-[10px] text-cyan-100/90" data-testid="crg-summary-projection-banner">
            Projection résumé :{" "}
            {diag.summaryProjectionOmitsChains ? "chaînes omises du corps de réponse." : ""}
            {diag.summaryProjectionClustersCapped ? " clusters limités à 12 entrées." : ""}
          </p>
        )}
        <p className="mt-1 text-[10px] text-slate-500">
          Marketplace ouvert <span className="font-mono">{String(diag.openMarketplace)}</span> · mode social{" "}
          <span className="font-mono">{String(diag.socialNetworkMode)}</span> · arêtes validées seules (défaut){" "}
          <span className="font-mono">{String(diag.validatedEdgesOnly)}</span>
        </p>
        {bundle.disclaimer ? (
          <p className="mt-2 border-t border-slate-800/80 pt-2 text-[10px] leading-snug text-slate-500">{bundle.disclaimer}</p>
        ) : null}
      </header>

      <RelationshipGraphOverviewSurface
        headline={overview.headline}
        acceptedRelationshipCount={overview.acceptedRelationshipCount}
        partnerOrganizationCount={overview.partnerOrganizationCount}
        concentrationIndex={overview.concentrationIndex}
        coverageIndex={overview.coverageIndex}
        fragilityIndex={overview.fragilityIndex}
        overviewExplanation={overview.overviewExplanation}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <RelationshipNodesSurface nodes={snap.nodes} />
        <RelationshipEdgesSurface edges={snap.edges} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <RelationshipSignalsSurface signals={snap.signals} />
        <DependencyClustersSurface clusters={snap.clusters} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <CoverageModelSurface
          relationshipDensity={coverage.relationshipDensity}
          distributionCoverage={coverage.distributionCoverage}
          upstreamCoverage={coverage.upstreamCoverage}
          downstreamCoverage={coverage.downstreamCoverage}
          isolatedAreas={coverage.isolatedAreas}
          coverageGaps={coverage.coverageGaps}
          coverageExplanation={coverage.coverageExplanation}
        />
        <CommercialBridgesSurface bridges={snap.bridges} />
      </div>

      <RelationshipChainsSurface chains={snap.chains} />

      <footer className="rounded border border-slate-800/80 bg-black/30 px-2 py-2 text-[9px] text-slate-500">
        Diagnostics cache: <span className="font-mono">{String(diag.composeCacheHit)}</span> · stratégie{" "}
        <span className="font-mono">{diag.cacheStrategy}</span> · poids <span className="font-mono">{diag.payloadWeightClass}</span>
      </footer>
    </div>
  );
}
