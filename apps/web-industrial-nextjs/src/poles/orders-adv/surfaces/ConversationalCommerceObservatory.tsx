"use client";

import type { ConversationalCommerceResponse } from "@venext/shared-contracts";

export function ConversationalCommerceObservatory({
  data,
  compact,
}: {
  data: ConversationalCommerceResponse | undefined;
  compact?: boolean;
}) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Conversational commerce disabled by <span className="font-mono text-slate-300">conversational_commerce_enabled</span>.
      </div>
    );
  }
  return (
    <section className="space-y-2 rounded border border-rose-900/25 bg-slate-950/40 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-200/90">Conversational commerce</p>
        <p className="text-[11px] text-slate-500">Anchored threads — product / negotiation / order context (not a chat UI).</p>
      </header>
      <p className="font-mono text-xs text-rose-100/90">Commerce index {data.commerceThroughMessagingIndex.toFixed(2)}</p>
      {data.capabilities?.length ? (
        <ul className="text-[10px] text-slate-500">
          {data.capabilities.map((c) => (
            <li key={c.key}>
              {c.key}: {c.available ? "disponible" : c.reason ?? "indisponible"}
            </li>
          ))}
        </ul>
      ) : null}
      <ul className={`${compact ? "max-h-28" : "max-h-40"} space-y-1 overflow-y-auto text-[11px]`}>
        {data.threads.slice(0, compact ? 6 : 14).map((t) => (
          <li key={t.threadId} className="flex flex-col gap-0.5 rounded border border-slate-800/60 px-2 py-1">
            <span className="font-mono text-[9px] text-slate-500">{t.threadType}</span>
            <span className="text-slate-200">{t.commerceAnchors.join(" · ")}</span>
            <span className="text-[10px] text-slate-500">
              tension {t.tension.toFixed(2)}
              {typeof t.cartConversionMessageCount === "number" ? ` · cart events ${t.cartConversionMessageCount}` : ""}
            </span>
            {t.latestStructuredMessages?.length ? (
              <span className="text-[9px] text-slate-600">
                derniers signaux: {t.latestStructuredMessages.map((m) => m.messageType).join(", ")}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
