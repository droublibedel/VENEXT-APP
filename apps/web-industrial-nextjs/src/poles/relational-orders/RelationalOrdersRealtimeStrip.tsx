"use client";

import { useMemo } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import {
  classifyRelationalOrdersStreamItem,
  RELATIONAL_ORDERS_REALTIME_CLASS_LABELS,
} from "./relational-orders-realtime-classification";

export function RelationalOrdersRealtimeStrip(props: { gateway: PoleRealtimeGateway }) {
  const { gateway } = props;
  const { connected, stream, demoMode, liveChannel } = gateway;
  const cls = useMemo(() => {
    for (const it of stream) {
      if (it.pole === "RELATIONAL_ORDERS" || it.relationalOrdersEnvelope) {
        const c = classifyRelationalOrdersStreamItem(it);
        if (c) return c;
      }
    }
    return null;
  }, [stream]);

  return (
    <section className="rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-[10px] text-slate-300">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold uppercase tracking-[0.2em] text-cyan-200/90">Temps réel commandes corridor</span>
        <span className={connected ? "text-emerald-300/90" : "text-amber-300/90"}>{connected ? "connected" : "offline"}</span>
        <span className="text-slate-500">{demoMode ? "demo" : "live"}</span>
        {liveChannel ? <span className="font-mono text-[9px] text-slate-500">{liveChannel}</span> : null}
      </div>
      {cls ? (
        <p className="mt-1 text-[9px] text-cyan-100/85" data-testid="relational-orders-realtime-classification">
          <span className="font-mono">{cls}</span> — {RELATIONAL_ORDERS_REALTIME_CLASS_LABELS[cls]}
        </p>
      ) : (
        <p className="mt-1 text-[9px] text-slate-500">En attente de frames live.relational_orders.* ou démo synthétique…</p>
      )}
    </section>
  );
}
