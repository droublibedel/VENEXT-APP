"use client";

import type { PoleRegistryEntry } from "../registry";

type Props = {
  entry: PoleRegistryEntry;
  connected: boolean;
  aiSummary: string;
  activeZone: string;
  /** Mock AI gateway — operational warnings strip (Instruction 5 §2A). */
  operationalAlerts?: string[];
  aiLoading?: boolean;
};

function accentClass(accent: PoleRegistryEntry["accent"]) {
  switch (accent) {
    case "amber":
      return "border-l-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.12)]";
    case "cyan":
      return "border-l-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.12)]";
    case "violet":
      return "border-l-violet-400 shadow-[0_0_24px_rgba(167,139,250,0.12)]";
    case "rose":
      return "border-l-rose-400 shadow-[0_0_24px_rgba(251,113,133,0.12)]";
    case "emerald":
      return "border-l-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.12)]";
    default:
      return "border-l-slate-400 shadow-[0_0_18px_rgba(148,163,184,0.12)]";
  }
}

export function ContextHeader({
  entry,
  connected,
  aiSummary,
  activeZone,
  operationalAlerts = [],
  aiLoading = false,
}: Props) {
  return (
    <header
      className={`mx-2 mt-2 border border-slate-800/80 border-l-4 bg-gradient-to-r from-slate-950 to-slate-900 px-4 py-3 md:mx-3 md:mt-3 ${accentClass(entry.accent)}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
            Intelligence cockpit · {entry.poleChannel.replace(/_/g, " ")}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
            {entry.title}
          </h1>
          <p className="mt-1 max-w-3xl text-xs text-slate-400 md:text-sm">{entry.subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right text-[11px]">
          <span
            className={`rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide ${
              connected
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-200"
            }`}
          >
            Realtime {connected ? "live" : "degraded"}
          </span>
          <span className="text-slate-500">Active zone · {activeZone}</span>
        </div>
      </div>
      {operationalAlerts.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {operationalAlerts.slice(0, 4).map((a, i) => (
            <li
              key={i}
              className="rounded border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-100/95"
            >
              {a}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 border-t border-slate-800/80 pt-2 font-mono text-[11px] leading-relaxed text-cyan-100/90 md:text-xs">
        AI field (mock): {aiLoading ? "Synthesizing interpretive bundle…" : aiSummary}
      </p>
    </header>
  );
}
