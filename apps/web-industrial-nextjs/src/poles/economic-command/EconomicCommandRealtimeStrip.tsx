"use client";

import { useMemo } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import {
  classifyEconomicCommandStreamItem,
  ECONOMIC_COMMAND_REALTIME_CLASS_LABELS,
} from "./economic-command-realtime-classification";
import { ECONOMIC_COMMAND_REALTIME_EVENT_TYPES } from "./economic-command-realtime-contract";

export function EconomicCommandRealtimeStrip({ gateway }: { gateway: PoleRealtimeGateway }) {
  const { connected, demoMode, liveChannel, stream } = gateway;
  const sample = ECONOMIC_COMMAND_REALTIME_EVENT_TYPES.slice(0, 4).join(" · ");

  const streamClass = useMemo(() => {
    for (const it of stream) {
      if (it.pole === "ECONOMIC_COMMAND" || it.economicCommandEnvelope) {
        const c = classifyEconomicCommandStreamItem(it);
        if (c) return c;
      }
    }
    return null;
  }, [stream]);

  return (
    <section className="rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-[10px] text-slate-300">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold uppercase tracking-[0.2em] text-amber-200/90">Realtime commande économique</span>
        <span className={connected ? "text-emerald-300/90" : "text-amber-300/90"}>{connected ? "connected" : "offline"}</span>
        <span className="text-slate-500">{demoMode ? "demo.economic_command.*" : "live.economic_command.*"}</span>
        {liveChannel ? <span className="font-mono text-slate-500">{liveChannel}</span> : null}
      </div>
      {streamClass ? (
        <p className="mt-1 text-[10px] text-cyan-100/90">
          Classification flux: <span className="font-mono text-cyan-200/90">{streamClass}</span> —{" "}
          {ECONOMIC_COMMAND_REALTIME_CLASS_LABELS[streamClass]}
        </p>
      ) : (
        <p className="mt-1 text-slate-500">En attente d&apos;événements economic_command sur le flux…</p>
      )}
      <p className="mt-1 text-slate-500">Contrat (échantillon): {sample}</p>
    </section>
  );
}
