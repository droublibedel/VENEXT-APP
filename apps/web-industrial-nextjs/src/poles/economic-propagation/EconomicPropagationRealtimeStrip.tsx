"use client";

import type { OperationalSignalItem } from "../types";

export function EconomicPropagationRealtimeStrip({
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
    <div className="flex flex-wrap items-center gap-2 rounded border border-violet-800/80 bg-slate-950/80 px-2 py-1.5 text-[10px] text-slate-100/90">
      <span className="font-semibold uppercase tracking-[0.2em]">Propagation stream</span>
      <span className={connected ? "text-violet-200" : "text-amber-300"}>{connected ? "linked" : "offline"}</span>
      <span className="text-slate-500">{demoMode ? "demo.economic_propagation.*" : "live.economic_propagation.*"}</span>
      {liveChannel ? <span className="font-mono text-slate-500">{liveChannel}</span> : null}
      {latest ? (
        <span className="max-w-[70vw] truncate text-slate-400" title={latest.detail}>
          {latest.economicPropagationEnvelope ?? latest.label}
        </span>
      ) : null}
    </div>
  );
}
