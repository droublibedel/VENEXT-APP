"use client";

import { useMemo } from "react";

import type { PoleRealtimeGateway } from "../shell/OperationalPoleCanvas";

export function CommercialTrustRealtimeStrip({ gateway }: { gateway: PoleRealtimeGateway }) {
  const { connected, stream, demoMode, liveChannel } = gateway;
  const cls = useMemo(() => {
    for (const it of stream) {
      if (it.pole === "COMMERCIAL_TRUST" || it.commercialTrustEnvelope) {
        return it.commercialTrustRealtimeClass ?? (demoMode ? "DEMO_MIRROR" : "DOMAIN_LIVE");
      }
    }
    return null;
  }, [stream, demoMode]);

  return (
    <section className="rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-[10px] text-slate-300">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold uppercase tracking-[0.2em] text-slate-200/90">Temps réel confiance corridor</span>
        <span className={connected ? "text-emerald-300/90" : "text-amber-300/90"}>{connected ? "connected" : "offline"}</span>
        <span className="text-slate-500">
          {cls === "SYNTHETIC_TICK"
            ? "demo.commercial_trust.synthetic_tick.*"
            : demoMode
              ? "demo.commercial_trust.*"
              : "live.commercial_trust.v1"}
        </span>
        {liveChannel ? <span className="font-mono text-[9px] text-slate-500">{liveChannel}</span> : null}
      </div>
      {cls ? (
        <p className="mt-1 text-[9px] text-slate-400" data-testid="commercial-trust-realtime-classification">
          <span className="font-mono">{cls}</span> — événements domaine sans catalogue ni messages.
        </p>
      ) : (
        <p className="mt-1 text-[9px] text-slate-500">En attente d’événements domaine confiance…</p>
      )}
    </section>
  );
}
