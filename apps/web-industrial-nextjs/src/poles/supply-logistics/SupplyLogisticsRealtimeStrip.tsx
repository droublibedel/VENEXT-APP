"use client";

import type { OperationalSignalItem } from "../types";

export function SupplyLogisticsRealtimeStrip({
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
    <div className="flex flex-wrap items-center gap-2 rounded border border-emerald-900/40 bg-emerald-950/20 px-2 py-1.5 text-[10px] text-emerald-100/90">
      <span className="font-semibold uppercase tracking-[0.2em]">Realtime</span>
      <span className={connected ? "text-emerald-300" : "text-rose-300"}>{connected ? "linked" : "offline"}</span>
      <span className="text-slate-500">{demoMode ? "demo.supply_logistics.*" : "live.supply_logistics.*"}</span>
      {liveChannel ? <span className="font-mono text-slate-500">{liveChannel}</span> : null}
      {latest ? (
        <span className="max-w-[70vw] truncate text-slate-400" title={latest.detail}>
          {latest.supplyLogisticsEnvelope ?? latest.label}
        </span>
      ) : null}
    </div>
  );
}
