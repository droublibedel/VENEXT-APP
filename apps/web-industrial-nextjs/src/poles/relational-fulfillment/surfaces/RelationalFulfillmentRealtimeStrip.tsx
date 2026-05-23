"use client";

import { useMemo } from "react";

import type { PoleRealtimeGateway } from "../../hooks/usePoleRealtimeGateway";

export function RelationalFulfillmentRealtimeStrip(props: { gateway: PoleRealtimeGateway }) {
  const { gateway } = props;
  const { connected, stream, demoMode, liveChannel } = gateway;
  const last = useMemo(() => {
    for (let i = stream.length - 1; i >= 0; i--) {
      const it = stream[i] as { relationalOrdersEnvelope?: string };
      if (typeof it.relationalOrdersEnvelope === "string" && it.relationalOrdersEnvelope.startsWith("relational.fulfillment.")) {
        return it.relationalOrdersEnvelope;
      }
    }
    return null;
  }, [stream]);

  return (
    <section className="rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-[10px] text-slate-300">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold uppercase tracking-[0.2em] text-cyan-200/90">Temps réel fulfillment corridor</span>
        <span className={connected ? "text-emerald-300/90" : "text-amber-300/90"}>{connected ? "connected" : "offline"}</span>
        <span className="text-slate-500">{demoMode ? "demo" : "live"}</span>
        {liveChannel ? <span className="font-mono text-[9px] text-slate-500">{liveChannel}</span> : null}
      </div>
      {last ? (
        <p className="mt-1 text-[9px] text-cyan-100/85" data-testid="relational-fulfillment-realtime-last">
          Dernier signal : <span className="font-mono">{last}</span>
        </p>
      ) : (
        <p className="mt-1 text-[9px] text-slate-500">En attente d’événements relational.fulfillment.*…</p>
      )}
    </section>
  );
}
