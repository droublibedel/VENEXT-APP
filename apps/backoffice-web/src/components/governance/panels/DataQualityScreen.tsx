"use client";

import { useEffect, useState } from "react";
import { fetchGovernanceJson } from "../../../lib/governance-api";
import { useGovernanceShell } from "../context/GovernanceShellContext";
import { OperationalStrip } from "../ui/OperationalStrip";
import { DebugPayloadDrawer } from "../ui/DebugPayloadDrawer";

type Finding = {
  code: string;
  severity: string;
  count: number;
  detail: string;
  recommendedAction?: string;
};

export function DataQualityScreen() {
  const { setSelection } = useGovernanceShell();
  const [data, setData] = useState<{ findings: Finding[]; summary: { totalFindings: number; high: number } } | null>(
    null,
  );

  useEffect(() => {
    void (async () => {
      const res = await fetchGovernanceJson<typeof data>("/data-quality");
      if (res.ok && res.data) setData(res.data);
    })();
  }, []);

  if (!data) return <p className="text-white/40">Running integrity scan…</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Data quality center</h2>
      <OperationalStrip label="Summary" tone={data.summary.high > 0 ? "alert" : "ok"}>
        {data.summary.totalFindings} findings · {data.summary.high} high severity
      </OperationalStrip>

      <div className="space-y-3">
        {data.findings.map((f) => (
          <button
            key={f.code}
            type="button"
            className="w-full rounded-lg border border-white/10 bg-black/30 p-3 text-left hover:bg-white/[0.04]"
            onClick={() => setSelection({ kind: "finding", code: f.code, payload: f })}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-cyan-200/90">{f.code}</span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  f.severity === "HIGH" ? "bg-[#FFC107]/20 text-[#FFC107]" : "bg-white/10 text-white/70"
                }`}
              >
                {f.severity} · {f.count}
              </span>
            </div>
            <p className="mt-2 text-[12px] text-white/75">{f.detail}</p>
            <p className="mt-1 text-[11px] text-emerald-200/80">Recommended: {f.recommendedAction ?? "Review with platform engineer."}</p>
          </button>
        ))}
      </div>

      <DebugPayloadDrawer label="data-quality raw" data={data} />
    </div>
  );
}
