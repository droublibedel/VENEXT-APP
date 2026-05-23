"use client";

import { useEffect, useState } from "react";
import { fetchGovernanceJson } from "../../../lib/governance-api";
import { OperationalStrip } from "../ui/OperationalStrip";
import { vx } from "../ui/vx-styles";
import { DebugPayloadDrawer } from "../ui/DebugPayloadDrawer";

export function IndustrialPolesScreen() {
  const [data, setData] = useState<{
    platformFlag: { enabled: boolean; source?: string };
    poles: { pole: string; label: string; configs: number; enabledCount: number; riskState: string }[];
    rawConfigsSample: unknown[];
  } | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetchGovernanceJson<typeof data>("/industrial-poles");
      if (res.ok && res.data) setData(res.data);
    })();
  }, []);

  if (!data) return <p className="text-white/40">Loading pole governance…</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Industrial pole governance</h2>
      <OperationalStrip label="Platform flag" tone={data.platformFlag.enabled ? "ok" : "alert"}>
        industrial_poles_enabled = {data.platformFlag.enabled ? "ON" : "OFF"}
      </OperationalStrip>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.poles.map((p) => (
          <div key={p.pole} className="rounded-lg border border-white/10 bg-black/25 p-3">
            <p className="text-[11px] font-semibold text-white">{p.label}</p>
            <p className="mt-1 text-[10px] text-white/55">
              Enabled configs {p.enabledCount}/{p.configs} · risk{" "}
              <span style={{ color: p.riskState !== "ACTIVE" ? vx.amber : vx.mint }}>{p.riskState}</span>
            </p>
            <p className="mt-2 text-[9px] text-white/40">
              AI context / map layers require cockpit bundles — inspect raw sample below in debug.
            </p>
          </div>
        ))}
      </div>

      <DebugPayloadDrawer label="pole configs sample" data={data.rawConfigsSample} />
    </div>
  );
}
