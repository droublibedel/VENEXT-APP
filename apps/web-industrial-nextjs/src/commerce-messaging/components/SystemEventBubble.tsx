"use client";

import type { Jsonish } from "../types";

type Props = {
  content: string | null;
  structuredEvent: Jsonish;
};

export function SystemEventBubble({ content, structuredEvent }: Props) {
  return (
    <div className="mx-auto max-w-lg rounded-md border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-center text-[11px] text-violet-100/95">
      <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-violet-300/80">
        Événement système
      </p>
      {content ? <p className="mt-1 leading-snug">{content}</p> : null}
      {structuredEvent && Object.keys(structuredEvent).length > 0 ? (
        <p className="mt-1 font-mono text-[9px] text-violet-200/70">{JSON.stringify(structuredEvent)}</p>
      ) : null}
    </div>
  );
}
