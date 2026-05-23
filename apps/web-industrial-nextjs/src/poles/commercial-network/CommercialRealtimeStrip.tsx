"use client";

import type { OperationalSignalItem } from "../types";

function extractHints(detail: string): { territory?: string; product?: string } {
  const t = detail.match(/territory[:\s]+([^·|]+)/i)?.[1]?.trim();
  const p = detail.match(/product[:\s]+([^·|]+)/i)?.[1]?.trim();
  return { territory: t, product: p };
}

export function CommercialRealtimeStrip({
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
  const hints = latest ? extractHints(latest.detail) : {};
  const modeLabel = demoMode ? "DEMO" : "LIVE";
  const channelHint = liveChannel ? ` · ${liveChannel}` : "";

  return (
    <div className="mx-2 mb-3 rounded border border-cyan-900/40 bg-slate-950/90 px-3 py-2 text-[11px] text-slate-300">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-200/90">Commercial realtime</span>
        <span
          className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${demoMode ? "bg-cyan-900/35 text-cyan-100" : "bg-emerald-900/40 text-emerald-100"}`}
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
          {latest.commercialEnvelope ? (
            <p className="font-mono text-[9px] text-emerald-200/85">
              {modeLabel} · {latest.commercialEnvelope}
            </p>
          ) : null}
          <p className="font-mono text-[10px] text-cyan-200/90">{latest.priority}</p>
          <p className="text-slate-200">{latest.label}</p>
          <p className="text-slate-500">{latest.detail}</p>
          {(hints.territory || hints.product) && (
            <p className="text-[10px] text-slate-600">
              {hints.territory ? <>Territory: {hints.territory} · </> : null}
              {hints.product ? <>Product: {hints.product}</> : null}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-slate-600">Awaiting relationship / negotiation / sponsorship batches (same gateway cap as canvas).</p>
      )}
    </div>
  );
}
