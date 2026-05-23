"use client";

import type { RelationalFulfillmentViewResponseDto } from "@venext/shared-contracts";

export function RelationalFulfillmentProofsSurface(props: { data: RelationalFulfillmentViewResponseDto | null }) {
  const proofs = props.data?.proofs ?? [];
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-fulfillment-proofs">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Preuves opérationnelles</p>
      {proofs.length === 0 ? (
        <p className="mt-2 text-[9px] text-slate-500">Aucune preuve de réception ou de chargement déposée.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {proofs.map((p) => (
            <li key={p.id} className="text-[9px] text-slate-300">
              <span className="font-mono text-cyan-100/90">{p.proofType}</span>
              <span className="text-slate-500"> · {p.createdAt}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
