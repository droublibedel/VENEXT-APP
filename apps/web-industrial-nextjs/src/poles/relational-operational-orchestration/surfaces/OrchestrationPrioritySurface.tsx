"use client";

import type { RelationalOperationalOrchestrationDto } from "@venext/shared-contracts";

export function OrchestrationPrioritySurface(props: {
  orchestrations: RelationalOperationalOrchestrationDto[];
  onApprove?: (id: string) => void;
  onStart?: (id: string) => void;
}) {
  const sorted = [...props.orchestrations].sort((a, b) => {
    const p = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return p[b.priority] - p[a.priority] || b.riskScore - a.riskScore;
  });

  if (sorted.length === 0) {
    return <p className="text-[9px] text-slate-500">Aucun plan d&apos;orchestration ouvert.</p>;
  }

  return (
    <ul className="mt-1 space-y-1" data-testid="orchestration-priority">
      {sorted.slice(0, 8).map((o) => (
        <li key={o.id} className="rounded border border-slate-800/80 px-2 py-1 text-[9px] text-slate-300">
          <span className="font-mono text-amber-200/80">{o.priority}</span> — {o.title}{" "}
          <span className="text-slate-500">({o.status})</span>
          {o.status === "WAITING_VALIDATION" && props.onApprove ? (
            <button
              type="button"
              className="ml-2 text-[8px] uppercase tracking-wider text-cyan-400/90"
              onClick={() => props.onApprove!(o.id)}
            >
              Approuver
            </button>
          ) : null}
          {o.status === "DRAFT" && props.onStart ? (
            <button
              type="button"
              className="ml-2 text-[8px] uppercase tracking-wider text-emerald-400/90"
              onClick={() => props.onStart!(o.id)}
            >
              Démarrer
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
