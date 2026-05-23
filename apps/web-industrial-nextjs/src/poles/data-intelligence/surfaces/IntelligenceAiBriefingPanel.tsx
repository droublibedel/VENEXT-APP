"use client";

import type { DataIntelligenceBriefingResponse } from "@venext/shared-contracts";

export function IntelligenceAiBriefingPanel({ data }: { data: DataIntelligenceBriefingResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <section className="rounded border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Briefing disabled</p>
        <p className="mt-1 font-mono text-[11px] text-slate-500">
          provider={data.provider} · providerMode={data.providerMode ?? "DISABLED"} · realLLMConnected=
          {String(data.realLLMConnected ?? false)} · mockContextUsed={String(data.mockContextUsed ?? true)}
        </p>
        <p className="mt-1 text-slate-500">{data.executiveSummary}</p>
      </section>
    );
  }
  return (
    <section className="rounded border border-violet-900/40 bg-violet-950/25 p-3 text-xs text-violet-50/95">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-violet-200/90">
        MockAI · economic superintelligence · {data.providerMode ?? "MOCK_PROVIDER"}
      </p>
      <p className="mt-0.5 font-mono text-[10px] text-violet-300/70">
        realLLMConnected={String(data.realLLMConnected ?? false)} · mockContextUsed={String(data.mockContextUsed ?? true)}
      </p>
      <p className="mt-1 font-semibold">{data.title}</p>
      <p className="mt-1 text-slate-300">{data.executiveSummary}</p>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <ul className="list-inside list-disc text-[11px] text-slate-400">
          {data.systemicTensions.slice(0, 4).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
        <ul className="list-inside list-disc text-[11px] text-slate-400">
          {data.futureRisks.slice(0, 4).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
