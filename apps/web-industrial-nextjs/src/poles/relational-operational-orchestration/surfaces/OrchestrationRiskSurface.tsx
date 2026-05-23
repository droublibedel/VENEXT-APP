"use client";

import type { RelationalOperationalOrchestrationDto } from "@venext/shared-contracts";

export function OrchestrationRiskSurface(props: { orchestrations: RelationalOperationalOrchestrationDto[] }) {
  const risk = props.orchestrations.filter((o) => o.priority === "CRITICAL" || o.priority === "HIGH");
  if (risk.length === 0) {
    return <p className="text-[9px] text-slate-500">Aucun plan à risque élevé actif.</p>;
  }
  return (
    <ul className="mt-1 space-y-1" data-testid="orchestration-risk">
      {risk.slice(0, 6).map((o) => (
        <li key={o.id} className="rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1 text-[9px] text-amber-100/90">
          {o.orchestrationType} — score {o.riskScore}
          {o.requiresHumanValidation ? (
            <span className="ml-1 font-mono text-[8px] text-amber-300/70">validation humaine</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
