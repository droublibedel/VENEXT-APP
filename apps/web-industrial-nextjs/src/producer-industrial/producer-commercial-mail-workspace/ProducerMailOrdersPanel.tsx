"use client";

import { memo } from "react";

import type { ProducerCommercialMailView } from "./producer-commercial-mail.types";

export const ProducerMailOrdersPanel = memo(function ProducerMailOrdersPanel({
  view,
  activeOrderId,
  onSelectOrder,
}: {
  view: ProducerCommercialMailView | null;
  activeOrderId?: string;
  onSelectOrder?: (id: string) => void;
}) {
  const orders = view?.orders ?? [];

  return (
    <section className="producer-industrial-card p-3" data-testid="producer-mail-orders-panel">
      <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Commandes liées</h4>
      {orders.length === 0 ? (
        <p className="mt-2 text-[10px] text-slate-500">Aucune commande à lier.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {orders.slice(0, 6).map((o) => (
            <li key={o.id}>
              <button
                type="button"
                className={`w-full rounded border px-2 py-1.5 text-left text-[10px] ${
                  activeOrderId === o.id
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
                onClick={() => onSelectOrder?.(o.id)}
                data-testid={`mail-linked-order-${o.id}`}
              >
                <span className="font-medium text-slate-200">{o.reference}</span>
                <span className="block text-slate-500">{o.partner}</span>
                <span className="text-slate-600">{o.amountLabel}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});
