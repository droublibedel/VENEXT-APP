"use client";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { ECONOMIC_COORDINATION_REALTIME_EVENT_TYPES } from "./economic-coordination-realtime-contract";

export function EconomicCoordinationRealtimeStrip({ gateway }: { gateway: PoleRealtimeGateway }) {
  const { connected, demoMode, liveChannel } = gateway;
  const sample = ECONOMIC_COORDINATION_REALTIME_EVENT_TYPES.slice(0, 4).join(" · ");
  return (
    <section className="rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-[10px] text-slate-300">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold uppercase tracking-[0.2em] text-cyan-200/90">Realtime coordination</span>
        <span className={connected ? "text-emerald-300/90" : "text-amber-300/90"}>{connected ? "connected" : "offline"}</span>
        <span className="text-slate-500">{demoMode ? "demo.economic_coordination.*" : "live.economic_coordination.*"}</span>
        {liveChannel ? <span className="font-mono text-slate-500">{liveChannel}</span> : null}
      </div>
      <p className="mt-1 text-slate-500">Contract sample: {sample}</p>
    </section>
  );
}
