"use client";

import { useEffect, useState } from "react";

import { fetchPersistedEconomicScenariosAudit, type PersistedScenariosAuditResponse } from "./economic-scenarios-api";

export function PersistedScenarioAuditSurface({ organizationId }: { organizationId: string }) {
  const [data, setData] = useState<PersistedScenariosAuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchPersistedEconomicScenariosAudit(organizationId, { limit: 12 });
        if (cancelled) return;
        if (!res) {
          setError("persisted_unavailable");
          return;
        }
        setData(res);
        setError(null);
      } catch {
        if (!cancelled) setError("persisted_fetch_failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  return (
    <section className="rounded border border-amber-900/40 bg-amber-950/15 p-3 text-xs text-slate-200">
      <h3 className="mb-1 font-semibold text-amber-100">Persisted audit trail — historical scenario records</h3>
      <p className="text-[10px] uppercase tracking-wide text-amber-200/80">
        Source mode: {data?.sourceMode ?? "PERSISTED_SCENARIO_AUDIT"} · Prisma read · does not replace live composed bundle
      </p>
      {error ? <p className="mt-2 text-amber-300/90">Audit load skipped: {error}</p> : null}
      {!error && data && data.rows.length === 0 ? (
        <p className="mt-2 text-slate-500">No persisted rows yet for this organization.</p>
      ) : null}
      {data && data.rows.length > 0 ? (
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-slate-300">
          {data.rows.map((r) => (
            <li key={r.id} className="rounded border border-slate-800/60 bg-slate-950/40 px-2 py-1 font-mono text-[10px]">
              <span className="text-cyan-200/90">{r.scenarioType}</span> · traj {r.trajectoryCount} · impacts {r.impactCount} · risk{" "}
              {r.projectedRisk.toFixed(2)} · {new Date(r.createdAt).toISOString().slice(0, 16)}
            </li>
          ))}
        </ul>
      ) : null}
      {data?.page.hasMore ? (
        <p className="mt-1 text-[10px] text-slate-500">More rows exist (cursor pagination available on API).</p>
      ) : null}
    </section>
  );
}
