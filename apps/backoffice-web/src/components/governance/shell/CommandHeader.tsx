"use client";

import { productionTokenMissing } from "../../../lib/governance-api";
import { useGovernanceShell } from "../context/GovernanceShellContext";
import { vx } from "../ui/vx-styles";

export function CommandHeader() {
  const { overview, lastRefresh, degraded, refreshOverview } = useGovernanceShell();
  const meta = overview as { meta?: { nodeEnv?: string; devAuthBypassActive?: boolean }; systemHealth?: { status?: string }; realtimeChannelState?: { demo?: string[]; live?: string[] } } | null;

  const bypass = meta?.meta?.devAuthBypassActive;
  const health = meta?.systemHealth?.status ?? "—";
  const modeDemo = Array.isArray(meta?.realtimeChannelState?.demo);

  return (
    <header
      className="border-b px-4 py-3"
      style={{ borderColor: vx.line, backgroundColor: vx.graphite }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em]" style={{ color: vx.mint }}>
              VENEXT · Command tower
            </p>
            <p className="text-xs text-white/70">Governance supervision layer</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: vx.teal }}
            >
              Health: {health}
            </span>
            <span className="rounded border border-white/15 px-2 py-0.5 text-[10px] text-white/80">
              Env: {meta?.meta?.nodeEnv ?? process.env.NODE_ENV}
            </span>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${degraded ? "bg-[#FFC107]/25 text-[#FFC107]" : "bg-emerald-900/40 text-emerald-200"}`}
            >
              {degraded ? "Upstream degraded" : "Live feed"}
            </span>
            <span className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-white/70">
              Channels:{" "}
              <span style={{ color: vx.amber }}>DEMO</span> /{" "}
              <span className="text-emerald-300">LIVE</span>
              {modeDemo ? " · contracts armed" : ""}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/60">
          <span>
            Last refresh: {lastRefresh ? lastRefresh.toLocaleTimeString() : "—"}
          </span>
          <button
            type="button"
            onClick={() => void refreshOverview()}
            className="rounded border border-white/15 px-2 py-1 text-[11px] text-white/90 hover:bg-white/5"
          >
            Refresh telemetry
          </button>
        </div>
      </div>

      {productionTokenMissing() ? (
        <div className="mt-2 rounded border border-[#FFC107]/40 bg-[#FFC107]/10 px-3 py-2 text-[11px] text-[#FFC107]">
          Production : configurez <span className="font-mono">NEXT_PUBLIC_VENEXT_BACKOFFICE_TOKEN</span> — sinon certaines actions de gouvernance ne pourront pas aboutir.
        </div>
      ) : null}

      {bypass ? (
        <div className="mt-2 rounded border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-[11px] text-amber-100">
          Core reports <span className="font-mono">DEV_AUTH_BYPASS</span> active — authorization relaxed on domain API (demo only).
        </div>
      ) : null}
    </header>
  );
}
