"use client";

import type { CommercialRelationshipChain } from "@venext/shared-contracts";

export function RelationshipChainsSurface(props: { chains: CommercialRelationshipChain[] }) {
  const rows = props.chains.slice(0, 16);
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="crg-chains-surface">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Chaînes relationnelles</h3>
      {rows.length === 0 ? (
        <p className="text-[10px] text-slate-500">
          Aucune chaîne dans cette projection (résumé bundle-first) ou modèle chaînes désactivé côté serveur.
        </p>
      ) : (
        <ul className="flex max-h-[180px] flex-col gap-1.5 overflow-auto pr-1">
          {rows.map((c) => (
            <li key={c.chainId} className="rounded border border-slate-800/80 bg-black/35 px-2 py-1.5 text-[10px]">
              <p className="font-mono text-[9px] text-emerald-200/85">{c.chainType}</p>
              <p className="text-slate-300">
                solidité {c.chainStrength.toFixed(2)} · fragilité {c.chainFragility.toFixed(2)}
              </p>
              <p className="mt-1 text-[9px] text-slate-500">{c.explanation}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
