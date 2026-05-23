"use client";

import type { OperationalSignalItem } from "../types";

export function OrderAdvRealtimeStrip({
  connected,
  demoMode,
  liveChannel,
  latest,
}: {
  connected: boolean;
  demoMode: boolean;
  liveChannel?: string;
  latest: OperationalSignalItem | undefined;
}) {
  const modeLabel = demoMode ? "DEMO" : "LIVE";
  const channelHint = liveChannel ? ` · ${liveChannel}` : "";

  return (
    <div className="mx-2 mb-3 rounded border border-rose-900/40 bg-slate-950/90 px-3 py-2 text-[11px] text-slate-300">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-200/90">Orders / ADV realtime</span>
        <span
          className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${demoMode ? "bg-rose-900/35 text-rose-100" : "bg-emerald-900/40 text-emerald-100"}`}
        >
          {modeLabel}
        </span>
        <span className="text-slate-500">
          feed {connected ? "online" : "offline"}
          {channelHint}
        </span>
      </div>
      {latest ? (
        <div className="mt-2 space-y-1">
          {latest.orderAdvEnvelope ? (
            <p className="font-mono text-[9px] text-amber-200/85">
              {modeLabel} · {latest.orderAdvEnvelope}
            </p>
          ) : null}
          <p className="font-mono text-[10px] text-rose-200/90">{latest.priority}</p>
          <p className="text-slate-200">{latest.label}</p>
          <p className="text-slate-500">{latest.detail}</p>
        </div>
      ) : (
        <p className="mt-2 text-slate-600">Awaiting negotiation / group-buy / reservation batches (throttled).</p>
      )}
    </div>
  );
}
