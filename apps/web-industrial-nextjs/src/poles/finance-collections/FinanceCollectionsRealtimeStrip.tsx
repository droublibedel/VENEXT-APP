"use client";

import type { OperationalSignalItem } from "../types";

export function FinanceCollectionsRealtimeStrip({
  connected,
  demoMode,
  liveChannel,
  latest,
}: {
  connected: boolean;
  demoMode: boolean;
  liveChannel?: string;
  latest?: OperationalSignalItem;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded border border-rose-900/40 bg-rose-950/25 px-2 py-1.5 text-[10px] text-rose-100/90">
      <span className="font-semibold uppercase tracking-[0.2em]">Realtime</span>
      <span className={connected ? "text-rose-200" : "text-amber-300"}>{connected ? "linked" : "offline"}</span>
      <span className="text-slate-500">{demoMode ? "demo.finance_collections.*" : "live.finance_collections.*"}</span>
      {liveChannel ? <span className="font-mono text-slate-500">{liveChannel}</span> : null}
      {latest ? (
        <span className="max-w-[70vw] truncate text-slate-400" title={latest.detail}>
          {latest.financeCollectionsEnvelope ?? latest.label}
        </span>
      ) : null}
    </div>
  );
}
