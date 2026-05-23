"use client";

import type { Jsonish } from "../types";

const proposalTypes = new Set([
  "PRICE_PROPOSAL",
  "QUANTITY_PROPOSAL",
  "PAYMENT_PROPOSAL",
  "DELIVERY_PROPOSAL",
]);

type Props = {
  mine: boolean;
  messageType: string;
  content: string | null;
  structuredEvent: Jsonish;
};

export function ProposalBubble({ mine, messageType, content, structuredEvent }: Props) {
  if (!proposalTypes.has(messageType)) return null;
  const se = structuredEvent && typeof structuredEvent === "object" ? structuredEvent : {};
  const kind = typeof se.kind === "string" ? se.kind : messageType.toLowerCase();

  return (
    <div
      className={`max-w-[min(100%,24rem)] rounded-lg border px-3 py-2 ${
        mine
          ? "border-amber-600/45 bg-amber-950/35 text-amber-50"
          : "border-slate-600/70 bg-slate-900/90 text-slate-100"
      }`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        Proposition commerciale · {kind.replace(/_/g, " ")}
      </p>
      {content ? <p className="mt-1 text-[12px] leading-snug">{content}</p> : null}
      <pre className="mt-2 max-h-28 overflow-auto rounded border border-slate-800/80 bg-black/40 p-2 font-mono text-[10px] text-slate-300">
        {JSON.stringify(structuredEvent ?? {}, null, 2)}
      </pre>
    </div>
  );
}
