"use client";

import type { CommercialRelationshipSignal, CommercialRelationshipSignalType } from "@venext/shared-contracts";

const SIGNAL_TYPE_LABELS: Partial<Record<CommercialRelationshipSignalType, string>> = {
  pending_relationship_signal: "Relations en attente (non validées dans le graphe)",
  expansion_opportunity_signal: "Ancrage / expansion réseau (arêtes récentes)",
  relationship_activity_signal: "Activité relative des arêtes",
  dependency_pressure_signal: "Pression de dépendance",
  concentration_warning_signal: "Concentration corridor",
  coverage_gap_signal: "Trous de couverture symboliques",
  bridge_overload_signal: "Pont commercial surchargé",
  dormant_network_signal: "Segments dormants",
  network_fragility_signal: "Fragilité locale",
};

export function RelationshipSignalsSurface(props: { signals: CommercialRelationshipSignal[] }) {
  const rows = props.signals.slice(0, 24);
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="crg-signals-surface">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Signaux consultatifs</h3>
      <p className="mb-2 text-[9px] text-amber-200/85">
        Heuristiques bornées — chaque confiance est documentée (pas de score opaque).
      </p>
      <ul className="flex max-h-[200px] flex-col gap-1.5 overflow-auto pr-1">
        {rows.map((s) => (
          <li key={s.signalId} className="rounded border border-slate-800/80 bg-black/35 px-2 py-1.5 text-[10px]">
            <p className="font-mono text-[9px] text-amber-100/90">{s.signalType}</p>
            {SIGNAL_TYPE_LABELS[s.signalType] ? (
              <p className="text-[9px] text-slate-400">{SIGNAL_TYPE_LABELS[s.signalType]}</p>
            ) : null}
            <p className="text-slate-300">
              sévérité <span className="text-slate-200">{s.severity}</span> · confiance {s.confidence.toFixed(2)}
            </p>
            <p className="mt-0.5 text-[9px] text-cyan-100/80">{s.confidenceExplanation}</p>
            <p className="mt-1 text-[9px] text-slate-500">{s.explanation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
