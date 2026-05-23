"use client";

import { useMemo } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import {
  classifyIndustrialSituationRoomStreamItem,
  INDUSTRIAL_SITUATION_ROOM_REALTIME_CLASS_LABELS,
} from "./industrial-situation-room-realtime-classification";

export function IndustrialSituationRoomRealtimeStrip({ gateway }: { gateway: PoleRealtimeGateway }) {
  const { connected, demoMode, liveChannel, stream } = gateway;
  const streamClass = useMemo(() => {
    for (const it of stream) {
      if (it.pole === "INDUSTRIAL_SITUATION_ROOM" || it.industrialSituationRoomEnvelope) {
        const c = classifyIndustrialSituationRoomStreamItem(it);
        if (c) return c;
      }
    }
    return null;
  }, [stream]);

  return (
    <section className="rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-[10px] text-slate-300">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold uppercase tracking-[0.2em] text-cyan-200/90">Realtime situation industrielle</span>
        <span className={connected ? "text-emerald-300/90" : "text-amber-300/90"}>{connected ? "connected" : "offline"}</span>
        <span className="text-slate-500">{demoMode ? "demo.industrial_situation_room.*" : "live.industrial_situation_room.*"}</span>
        {liveChannel ? <span className="font-mono text-slate-500">{liveChannel}</span> : null}
      </div>
      {streamClass ? (
        <p className="mt-1 text-[10px] text-cyan-100/90">
          Classification flux: <span className="font-mono text-cyan-200/90">{streamClass}</span> —{" "}
          {INDUSTRIAL_SITUATION_ROOM_REALTIME_CLASS_LABELS[streamClass]}
        </p>
      ) : (
        <p className="mt-1 text-slate-500">En attente d&apos;événements industrial_situation_room…</p>
      )}
    </section>
  );
}
