"use client";

import type { EconomicScoreResponse } from "@venext/shared-contracts";

export function EconomicScoreSurface({ data }: { data: EconomicScoreResponse | undefined }) {
  if (!data || data.policy === "DISABLED") return null;
  const rows = [
    ["Org economic", data.organizationEconomicScore],
    ["Territory", data.territoryEconomicScore],
    ["Network resilience", data.networkResilienceScore],
    ["Liquidity stress", data.liquidityStressScore],
    ["Fulfillment reliability", data.fulfillmentReliabilityScore],
    ["Relationship trust", data.relationshipTrustScore],
  ] as const;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
      <p className="font-semibold text-slate-100">Economic scores (0–1, explained)</p>
      <ul className="mt-2 space-y-2">
        {rows.map(([label, cell]) => (
          <li key={label}>
            <span className="text-slate-400">{label}</span>{" "}
            <span className="font-mono text-cyan-200/90">{cell.score.toFixed(2)}</span>
            <p className="text-[10px] text-slate-500">{cell.explanation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
