"use client";

import type { RelationalFulfillmentViewResponseDto } from "@venext/shared-contracts";

import { fulfillmentStatusHeadline } from "../relational-fulfillment-copy";

export function RelationalFulfillmentGovernanceSurface(props: { data: RelationalFulfillmentViewResponseDto | null }) {
  const raw = props.data?.fulfillment.fulfillmentStatus ?? "—";
  const label = raw === "—" ? "—" : fulfillmentStatusHeadline(raw);
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-fulfillment-governance">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Gouvernance fulfillment corridor</p>
      <p className="mt-2 text-[10px] text-slate-300">
        Statut fulfillment : <span className="font-mono text-cyan-100/90">{label}</span>
      </p>
      <p className="mt-2 text-[9px] text-slate-500">
        Validation inter-partenaires et conformité réception — paiement orchestré désactivé (
        <span className="font-mono">paymentExecutionDisabled</span>), pas de lien destiné aux consommateurs finaux (
        <span className="font-mono">publicTrackingDisabled</span>).
      </p>
    </section>
  );
}
