"use client";

import type { GroupBuyingSupervisionResponse } from "@venext/shared-contracts";

export function GroupBuyingSupervision({
  data,
  compact,
}: {
  data: GroupBuyingSupervisionResponse | undefined;
  compact?: boolean;
}) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Group buying supervision disabled by <span className="font-mono text-slate-300">group_buying_enabled</span>.
      </div>
    );
  }
  return (
    <section className="space-y-2 rounded border border-emerald-900/25 bg-slate-950/35 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-200/85">Group buying supervision</p>
        <p className="text-[11px] text-slate-500">
          {data.dataSource} · active sessions {data.activeSessions}
        </p>
      </header>
      <ul className={`${compact ? "max-h-28" : "max-h-40"} space-y-1 overflow-y-auto text-[11px]`}>
        {data.rows.slice(0, compact ? 5 : 10).map((r) => (
          <li key={r.sessionId} className="flex flex-col gap-0.5 rounded border border-slate-800/60 px-2 py-1">
            <span className="text-slate-200">{r.productName}</span>
            <span className="font-mono text-emerald-200/90">
              {r.thresholdProgress.toFixed(2)} · {r.velocityHint}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
