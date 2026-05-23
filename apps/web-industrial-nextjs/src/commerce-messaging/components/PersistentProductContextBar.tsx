"use client";

import { useState } from "react";

import type { CommerceContextResponse } from "../types";

type Props = {
  context: CommerceContextResponse;
};

/** Pinned operational context — product, order, or payment thread (Instruction 7 §2, §13). */
export function PersistentProductContextBar({ context }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const p = context.product;
  const neg = context.negotiation;
  const ord = context.order;

  const title =
    context.threadType === "DELIVERY_CONTEXT"
      ? "Contexte livraison"
      : context.threadType === "PAYMENT_CONTEXT"
        ? "Contexte paiement"
        : context.threadType === "ORDER_CONTEXT"
          ? "Contexte commande"
          : "Contexte produit";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/90 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950/95 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2 px-3 py-2">
        <div className="flex min-w-0 flex-1 gap-3">
          {p?.imageUrls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.imageUrls[0]}
              alt=""
              className="h-14 w-14 shrink-0 rounded-md border border-slate-700 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-[9px] text-slate-500">
              Ctx
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-cyan-300/85">{title}</p>
            {p ? (
              <>
                <h2 className="truncate text-sm font-semibold text-slate-50">{p.name}</h2>
                <p className="truncate text-[10px] text-slate-400">
                  Fournisseur · {p.organization.displayName}{" "}
                  <span className="font-mono text-slate-500">#{p.organization.commercialId}</span>
                </p>
              </>
            ) : ord ? (
              <>
                <h2 className="truncate text-sm font-semibold text-slate-50">Commande {ord.id.slice(0, 8)}…</h2>
                <p className="text-[10px] text-slate-400">
                  {ord.status} · paiement {ord.paymentStatus} · logistique {ord.deliveryStatus}
                </p>
              </>
            ) : (
              <h2 className="text-sm font-semibold text-slate-200">Fil commercial sans fiche produit</h2>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="shrink-0 rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:border-cyan-600/50"
        >
          {collapsed ? "Déplier" : "Replier"}
        </button>
      </div>
      {!collapsed ? (
        <div className="grid gap-2 border-t border-slate-800/80 px-3 py-2 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="Stock" value={p?.stockStatus ?? "—"} />
          <Metric label="Paiement (SKU)" value={p?.paymentModes.slice(0, 2).join(" · ") ?? "—"} />
          <Metric label="Qté négociée" value={neg?.proposedQuantity ?? neg?.acceptedQuantity ?? "—"} />
          <Metric label="Prix négocié" value={neg?.proposedPrice ?? neg?.acceptedPrice ?? "—"} />
          <Metric label="Statut négociation" value={neg?.status ?? "—"} />
          <Metric label="Montant commande" value={ord ? `${ord.totalAmount} ${ord.currency}` : "—"} />
        </div>
      ) : null}
    </header>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800/80 bg-black/30 px-2 py-1.5">
      <p className="text-[8px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="truncate text-[11px] font-mono text-slate-100">{value}</p>
    </div>
  );
}
