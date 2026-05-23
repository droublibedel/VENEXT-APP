"use client";

import { useEffect, useState } from "react";
import { fetchGovernanceJson } from "../../../lib/governance-api";
import { OperationalStrip } from "../ui/OperationalStrip";
import { vx } from "../ui/vx-styles";
import { DebugPayloadDrawer } from "../ui/DebugPayloadDrawer";

type Rt = {
  demoChannels: { name: string; kind: string; description?: string }[];
  liveChannels: { name: string; kind: string; description?: string }[];
  gatewayHealth: { ok?: boolean; latencyMs?: number; error?: string; body?: unknown };
  connectedClients: number | null;
  note?: string;
};

export function RealtimeGovernanceScreen() {
  const [data, setData] = useState<Rt | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetchGovernanceJson<Rt>("/realtime");
      if (res.ok && res.data) setData(res.data);
    })();
  }, []);

  if (!data) return <p className="text-white/40">Loading realtime supervision…</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Realtime & signal monitoring</h2>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-lg border border-[#FFC107]/30 bg-[#FFC107]/5 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: vx.amber }}>
            DEMO channels
          </p>
          <ul className="space-y-2">
            {data.demoChannels.map((c) => (
              <li key={c.name} className="rounded border border-[#FFC107]/25 bg-black/30 px-2 py-1.5 text-[11px]">
                <span className="font-mono text-[#FFC107]">{c.name}</span>
                <p className="text-[10px] text-white/55">{c.description}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-emerald-800/40 bg-emerald-950/15 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-300">LIVE channels</p>
          <ul className="space-y-2">
            {data.liveChannels.map((c) => (
              <li key={c.name} className="rounded border border-emerald-800/30 bg-black/30 px-2 py-1.5 text-[11px]">
                <span className="font-mono text-emerald-200">{c.name}</span>
                <p className="text-[10px] text-white/55">{c.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <OperationalStrip label="Gateway health" tone={data.gatewayHealth.ok ? "ok" : "alert"}>
        {data.gatewayHealth.ok
          ? `OK · ${data.gatewayHealth.latencyMs ?? "—"} ms`
          : data.gatewayHealth.error ?? "Probe failed or URL unset"}
      </OperationalStrip>

      <OperationalStrip label="Connected clients">
        {data.connectedClients === null ? (
          <span className="text-[#FFC107]">Metric unavailable — instrumentation pending on gateway.</span>
        ) : (
          String(data.connectedClients)
        )}
      </OperationalStrip>

      <OperationalStrip label="Signal backlog">
        <span className="text-[#FFC107]">Metric unavailable — no backlog exporter wired.</span>
      </OperationalStrip>

      <p className="text-[11px] text-white/45">{data.note}</p>

      <DebugPayloadDrawer label="realtime" data={data} />
    </div>
  );
}
