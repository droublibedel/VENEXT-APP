"use client";

import { useMemo } from "react";

import type { PoleRealtimeGateway } from "../shell/OperationalPoleCanvas";
import {
  classifyCommercialRelationshipGraphStreamItem,
  COMMERCIAL_RELATIONSHIP_GRAPH_REALTIME_CLASS_LABELS,
} from "./commercial-relationship-graph-realtime-classification";

export function RelationshipGraphRealtimeStrip({ gateway }: { gateway: PoleRealtimeGateway }) {
  const { connected, stream, demoMode, liveChannel } = gateway;
  const cls = useMemo(() => {
    for (const it of stream) {
      if (it.pole === "COMMERCIAL_RELATIONSHIP_GRAPH" || it.commercialRelationshipGraphEnvelope) {
        const c = classifyCommercialRelationshipGraphStreamItem(it);
        if (c) return c;
      }
    }
    return null;
  }, [stream]);

  return (
    <section className="rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-[10px] text-slate-300">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold uppercase tracking-[0.2em] text-cyan-200/90">Realtime graphe relationnel</span>
        <span className={connected ? "text-emerald-300/90" : "text-amber-300/90"}>{connected ? "connected" : "offline"}</span>
        <span className="text-slate-500">
          {cls === "SYNTHETIC_TICK"
            ? "demo.commercial_relationship_graph.synthetic_tick.*"
            : demoMode
              ? "demo.commercial_relationship_graph.*"
              : "live.commercial_relationship_graph.*"}
        </span>
        {liveChannel ? <span className="font-mono text-[9px] text-slate-500">{liveChannel}</span> : null}
      </div>
      {cls ? (
        <p className="mt-1 text-[9px] text-cyan-100/85" data-testid="crg-realtime-classification">
          <span className="font-mono">{cls}</span> — {COMMERCIAL_RELATIONSHIP_GRAPH_REALTIME_CLASS_LABELS[cls]}
        </p>
      ) : (
        <p className="mt-1 text-[9px] text-slate-500">En attente d’événements domaine graphe…</p>
      )}
    </section>
  );
}
