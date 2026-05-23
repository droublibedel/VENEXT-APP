"use client";

import { useMemo } from "react";

import type { PoleRealtimeGateway } from "../shell/OperationalPoleCanvas";
import {
  classifyRelationalCatalogStreamItem,
  RELATIONAL_CATALOG_REALTIME_CLASS_LABELS,
} from "./relational-catalog-realtime-classification";

export function RelationalCatalogRealtimeStrip({ gateway }: { gateway: PoleRealtimeGateway }) {
  const { connected, stream, demoMode, liveChannel } = gateway;
  const cls = useMemo(() => {
    for (const it of stream) {
      if (it.pole === "RELATIONAL_CATALOG" || it.relationalCatalogEnvelope) {
        const c = classifyRelationalCatalogStreamItem(it);
        if (c) return c;
      }
    }
    return null;
  }, [stream]);

  return (
    <section className="rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-[10px] text-slate-300">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Realtime catalogues relationnels</span>
        <span className={connected ? "text-emerald-300/90" : "text-amber-300/90"}>{connected ? "connected" : "offline"}</span>
        <span className="text-slate-500">
          {cls === "SYNTHETIC_TICK"
            ? "demo.relational_catalog.synthetic_tick.*"
            : demoMode
              ? "demo.relational_catalog.*"
              : "live.relational_catalog.*"}
        </span>
        {liveChannel ? <span className="font-mono text-[9px] text-slate-500">{liveChannel}</span> : null}
      </div>
      {cls ? (
        <p className="mt-1 text-[9px] text-emerald-100/85" data-testid="relational-catalog-realtime-classification">
          <span className="font-mono">{cls}</span> — {RELATIONAL_CATALOG_REALTIME_CLASS_LABELS[cls]}
        </p>
      ) : (
        <p className="mt-1 text-[9px] text-slate-500">En attente d’événements domaine catalogue…</p>
      )}
    </section>
  );
}
