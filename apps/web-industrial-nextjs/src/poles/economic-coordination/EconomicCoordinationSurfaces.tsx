"use client";

import type { EconomicCoordinationBundle } from "@venext/shared-contracts";

export function CoordinationOverviewSurface({ bundle }: { bundle: EconomicCoordinationBundle | null }) {
  if (!bundle) return null;
  const o = bundle.overview;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-200">
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">Centre de coordination — vue d’ensemble</h3>
      <p className="text-sm text-slate-100">{o.headline}</p>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
        <div>
          <dt className="text-slate-500">Conflits actifs</dt>
          <dd className="font-mono text-cyan-200/90">{o.activeConflictCount}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Priorités</dt>
          <dd className="font-mono text-cyan-200/90">{o.priorityCount}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Pression temps réel</dt>
          <dd className="font-mono">{o.realtimePressure.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Pression intelligence systémique (proxy DI)</dt>
          <dd className="font-mono">{o.systemicIntelligencePressure.toFixed(2)}</dd>
        </div>
      </dl>
      {o.diagnostics ? (
        <p className="mt-2 font-mono text-[10px] text-slate-500">
          cacheHit={String(o.diagnostics.composeCacheHit)} · {o.diagnostics.snapshotReuse}
          {o.diagnostics.strategicPressureLabel ? ` · ${o.diagnostics.strategicPressureLabel}` : ""}
        </p>
      ) : null}
    </section>
  );
}

export function PostureSurface({ bundle }: { bundle: EconomicCoordinationBundle | null }) {
  if (!bundle) return null;
  const p = bundle.posture;
  return (
    <section className="rounded border border-violet-900/40 bg-violet-950/25 p-3 text-xs text-slate-200">
      <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-violet-200/90">Posture système</h3>
      <p className="font-mono text-sm text-violet-100">{p.posture}</p>
      <p className="mt-1 text-slate-400">{p.explanation}</p>
      <p className="mt-1 text-[10px] text-slate-500">
        confiance {p.confidence.toFixed(2)} · risque systémique {p.systemicRisk.toFixed(2)} · stress coordination{" "}
        {p.coordinationStress.toFixed(2)}
      </p>
    </section>
  );
}

export function ConflictMatrixSurface({ bundle }: { bundle: EconomicCoordinationBundle | null }) {
  if (!bundle) return null;
  return (
    <section className="rounded border border-rose-900/40 bg-rose-950/20 p-3 text-xs text-slate-200">
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-200/90">Matrice de conflits</h3>
      <ul className="flex flex-col gap-2">
        {bundle.conflicts.map((c) => (
          <li key={c.conflictId} className="rounded border border-rose-900/30 bg-black/40 p-2">
            <p className="font-mono text-[10px] text-rose-100/90">{c.conflictType}</p>
            <p className="text-[11px] text-slate-300">{c.recommendationCollision}</p>
            <p className="mt-1 text-[10px] text-slate-500">Sévérité {c.severity.toFixed(2)} · impact {c.systemicImpact.toFixed(2)}</p>
            <p className="mt-1 text-[10px] text-amber-200/85">Arbitrage: {c.arbitrationDirection}</p>
          </li>
        ))}
      </ul>
      {bundle.conflicts.length === 0 ? <p className="text-slate-500">Aucun conflit détecté sur ce fenêtrage.</p> : null}
    </section>
  );
}

export function OrchestrationQueueSurface({ bundle }: { bundle: EconomicCoordinationBundle | null }) {
  if (!bundle) return null;
  return (
    <section className="rounded border border-cyan-900/40 bg-cyan-950/15 p-3 text-xs text-slate-200">
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-200/90">File d’orchestration</h3>
      {bundle.orchestrations.map((o) => (
        <article key={o.orchestrationId} className="mb-3 rounded border border-cyan-900/30 bg-black/35 p-2">
          <p className="font-semibold text-cyan-50">{o.title}</p>
          <p className="text-slate-400">{o.rationale}</p>
          <ol className="mt-2 list-decimal pl-4 text-[11px] text-slate-300">
            {o.orderedRecommendations.map((r) => (
              <li key={`${o.orchestrationId}-${r.order}`}>
                {r.headline} — {r.rationale}
              </li>
            ))}
          </ol>
        </article>
      ))}
      {bundle.orchestrations.length === 0 ? <p className="text-slate-500">Orchestration désactivée ou vide.</p> : null}
    </section>
  );
}

export function EscalationPanelSurface({ bundle }: { bundle: EconomicCoordinationBundle | null }) {
  if (!bundle) return null;
  const e = bundle.escalation;
  return (
    <section className="rounded border border-amber-900/50 bg-amber-950/20 p-3 text-xs text-slate-200">
      <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-200/90">Escalade systémique</h3>
      <p className="font-mono text-lg text-amber-100">{e.escalationLevel}</p>
      <p className="text-slate-400">{e.coordinationRecommendation}</p>
      <p className="mt-1 text-[10px] text-slate-500">Score {e.escalationScore.toFixed(2)} · exécutif: {String(e.executiveAttentionRequired)}</p>
    </section>
  );
}

export function PriorityLadderSurface({ bundle }: { bundle: EconomicCoordinationBundle | null }) {
  if (!bundle) return null;
  return (
    <section className="rounded border border-emerald-900/40 bg-emerald-950/15 p-3 text-xs text-slate-200">
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-200/90">Échelle de priorités transverses</h3>
      <ol className="flex flex-col gap-2">
        {bundle.priorities.map((p) => (
          <li key={p.priorityId} className="flex items-start justify-between gap-2 rounded border border-emerald-900/25 bg-black/35 px-2 py-1">
            <div>
              <p className="font-mono text-[10px] text-emerald-100/90">{p.priorityId}</p>
              <p className="text-[11px] text-slate-400">{p.priorityReason}</p>
            </div>
            <span className="shrink-0 font-mono text-emerald-200/90">{p.priorityScore.toFixed(2)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function MemorySurface({ bundle }: { bundle: EconomicCoordinationBundle | null }) {
  if (!bundle) return null;
  const m = bundle.memory;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-200">
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">Mémoire de coordination</h3>
      <p className="text-[11px] text-slate-400">
        Heuristiques déterministes — pas d’entraînement ML. Confiance {m.memoryConfidence.toFixed(2)} · similarité{" "}
        {m.historicalSimilarity.toFixed(2)}
      </p>
      <ul className="mt-2 list-disc pl-4 text-[11px] text-slate-500">
        {m.recurringPatterns.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </section>
  );
}
