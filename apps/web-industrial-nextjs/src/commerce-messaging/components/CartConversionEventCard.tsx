"use client";

import type { Jsonish } from "../types";

type Props = {
  content: string | null;
  structuredEvent: Jsonish;
};

export function CartConversionEventCard({ content, structuredEvent }: Props) {
  const se = structuredEvent && typeof structuredEvent === "object" ? structuredEvent : {};
  const orderId = typeof se.orderId === "string" ? se.orderId : null;

  return (
    <div className="mx-auto max-w-lg rounded-lg border border-emerald-500/35 bg-emerald-950/30 px-4 py-3 text-[12px] text-emerald-50">
      <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-emerald-200/90">
        Conversion panier relationnel
      </p>
      <p className="mt-1 leading-snug">{content ?? "Produit basculé en commande brouillon."}</p>
      {orderId ? (
        <p className="mt-2 font-mono text-[10px] text-emerald-200/80">
          Order draft · <span className="text-emerald-100">{orderId}</span>
        </p>
      ) : null}
    </div>
  );
}
