export function SupplyFlowOverviewSurface(props: {
  title: string;
  nodeCount: number;
  edgeCount: number;
  diagnostics: {
    heuristicFallbackUsed: boolean;
    fallbackReasons: string[];
    volumeConfidenceLevel: string;
    predictiveSignalsUsed: number;
    strategicMemoriesUsed: number;
    operationalMetricsUsed: number;
    propagationTraversal: { boundedTraversalApplied: boolean; cascadeDepth: number };
  } | null;
}) {
  const dq = props.diagnostics;
  const qualityLabel =
    dq == null
      ? "—"
      : dq.heuristicFallbackUsed
        ? "Partiellement dérivé (fallback explicite)"
        : dq.volumeConfidenceLevel === "HIGH"
          ? "Réel (lignes commande)"
          : "Agrégé (corridor)";
  return (
    <section className="rounded border border-orange-900/40 bg-orange-950/20 p-2">
      <h4 className="text-[9px] font-semibold uppercase tracking-wide text-orange-200/90">{props.title}</h4>
      <p className="mt-1 text-[8px] text-orange-100/70">
        Nœuds observés : <span className="font-mono text-orange-200">{props.nodeCount}</span> — liaisons flux :{" "}
        <span className="font-mono text-orange-200">{props.edgeCount}</span>
      </p>
      {dq ? (
        <div className="mt-2 space-y-1 border-t border-orange-900/30 pt-2 text-[8px] text-orange-100/75">
          <p>
            <span className="font-semibold text-orange-200/90">Qualité données :</span> {qualityLabel}
          </p>
          <p className="font-mono text-[7px] text-orange-100/60">
            PR:{dq.predictiveSignalsUsed} M:{dq.strategicMemoriesUsed} OM:{dq.operationalMetricsUsed} · profondeur
            propagation {dq.propagationTraversal.cascadeDepth}
            {dq.propagationTraversal.boundedTraversalApplied ? " (troncature politique)" : ""}
          </p>
          {dq.fallbackReasons.length > 0 ? (
            <p className="text-[7px] text-amber-200/90">
              Fallbacks : {dq.fallbackReasons.slice(0, 4).join(" · ")}
              {dq.fallbackReasons.length > 4 ? " …" : ""}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
