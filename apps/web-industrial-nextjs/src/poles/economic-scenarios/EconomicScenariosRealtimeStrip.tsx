"use client";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

export function EconomicScenariosRealtimeStrip({ gateway }: { gateway: PoleRealtimeGateway }) {
  const { connected, demoMode, liveChannel } = gateway;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded border border-slate-800/80 bg-slate-950/50 px-2 py-1 text-[10px] text-slate-400">
      <span className={connected ? "text-emerald-400" : "text-rose-300"}>{connected ? "WS connected" : "WS offline"}</span>
      <span className="text-slate-600">|</span>
      <span className="text-slate-500">{demoMode ? "demo.economic_scenarios.*" : "live.economic_scenarios.*"}</span>
      {liveChannel ? <span className="text-slate-600">· {liveChannel}</span> : null}
    </div>
  );
}
