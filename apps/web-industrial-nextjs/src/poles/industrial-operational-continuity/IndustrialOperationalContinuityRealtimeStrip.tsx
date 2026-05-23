"use client";

import { useMemo } from "react";

import type { PoleRealtimeGateway } from "../shell/OperationalPoleCanvas";
import { classifyIndustrialOperationalContinuityStreamItem } from "./industrial-operational-continuity-realtime-classification";

export function IndustrialOperationalContinuityRealtimeStrip({ gateway }: { gateway: PoleRealtimeGateway }) {
  const { connected, stream, demoMode, liveChannel } = gateway;
  const cls = useMemo(() => {
    for (const it of stream) {
      if (it.pole === "INDUSTRIAL_OPERATIONAL_CONTINUITY" || it.industrialOperationalContinuityEnvelope) {
        const c = classifyIndustrialOperationalContinuityStreamItem(it);
        if (c) return c;
      }
    }
    return null;
  }, [stream]);

  return (
    <section className="rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-[10px] text-slate-300">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Realtime continuité industrielle</span>
        <span className={connected ? "text-emerald-300/90" : "text-amber-300/90"}>{connected ? "connected" : "offline"}</span>
        <span className="text-slate-500">
          {cls === "SYNTHETIC_TICK"
            ? "demo.industrial_operational_continuity.synthetic_tick.*"
            : demoMode
              ? "demo.industrial_operational_continuity.*"
              : "live.industrial_operational_continuity.*"}
        </span>
        {liveChannel ? <span className="font-mono text-[9px] text-slate-500">{liveChannel}</span> : null}
      </div>
      {cls ? (
        <p className="mt-1 text-[9px] text-cyan-100/85">
          <span className="font-mono">{cls}</span> —{" "}
          {cls === "DOMAIN_LIVE"
            ? "Signal domaine core (fan-in HTTP)."
            : cls === "DEMO_MIRROR"
              ? "Miroir démo — forme live, provenance démo."
              : "Tick synthétique batch — non domaine."}
        </p>
      ) : (
        <p className="mt-1 text-[9px] text-slate-500">En attente d’événements continuité…</p>
      )}
    </section>
  );
}
