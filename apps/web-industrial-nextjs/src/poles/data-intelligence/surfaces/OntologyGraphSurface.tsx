"use client";

import type { EconomicOntologyResponse } from "@venext/shared-contracts";

export function OntologyGraphSurface({ data }: { data: EconomicOntologyResponse | undefined }) {
  if (!data || data.policy === "DISABLED") return null;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
      <p className="font-semibold text-slate-100">Economic ontology</p>
      <p className="mt-1 text-slate-400">Propagation {data.economicPropagationScore.toFixed(2)} · graph density {data.graphDensity.toFixed(2)}</p>
      <ul className="mt-2 list-inside list-disc text-[11px] text-slate-400">
        {data.dependencyChains.slice(0, 4).map((c) => (
          <li key={c.id}>{c.narrative}</li>
        ))}
      </ul>
    </section>
  );
}
