"use client";

import type { CommercialBridge } from "@venext/shared-contracts";

export function CommercialBridgesSurface(props: { bridges: CommercialBridge[] }) {
  const rows = props.bridges.slice(0, 16);
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="crg-bridges-surface">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Ponts commerciaux</h3>
      <ul className="flex max-h-[180px] flex-col gap-1.5 overflow-auto pr-1">
        {rows.map((b) => (
          <li key={b.bridgeId} className="rounded border border-slate-800/80 bg-black/35 px-2 py-1.5 text-[10px]">
            <p className="text-slate-200">
              {b.bridgeType}{" "}
              <span className="font-mono text-[9px] text-slate-500">{b.organizationId}</span>
            </p>
            <p className="mt-0.5 text-slate-400">
              charge {b.bridgeLoad.toFixed(2)} · risque surcharge {b.overloadRisk.toFixed(2)}
            </p>
            <p className="mt-1 text-[9px] text-slate-500">{b.explanation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
