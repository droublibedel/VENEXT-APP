"use client";

import { useEffect, useState } from "react";
import { fetchGovernanceJson } from "../../../lib/governance-api";
import { OperationalStrip } from "../ui/OperationalStrip";
import { DebugPayloadDrawer } from "../ui/DebugPayloadDrawer";

export function PaymentsScreen() {
  const [data, setData] = useState<{
    evaluated: Record<string, { enabled: boolean; source: string }>;
    effectiveSnapshot: Record<string, boolean>;
    transactionMockStatus: string;
    recentTransactions: unknown[];
  } | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetchGovernanceJson<typeof data>("/payments");
      if (res.ok && res.data) setData(res.data);
    })();
  }, []);

  if (!data) return <p className="text-white/40">Loading payment capability matrix…</p>;

  const keys = Object.keys(data.evaluated ?? {});

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Payment / wallet capability control</h2>
      <OperationalStrip label="Ledger">{data.transactionMockStatus}</OperationalStrip>
      <div className="grid gap-2 md:grid-cols-2">
        {keys.map((k) => {
          const ev = data.evaluated[k];
          return (
            <OperationalStrip key={k} label={k} tone={ev?.enabled ? "ok" : "alert"}>
              {ev?.enabled ? "READY" : "OFF"} · source {ev?.source ?? "—"}
            </OperationalStrip>
          );
        })}
      </div>
      <p className="text-[11px] text-white/45">Capability toggles live under Feature control — this surface is read-only inspection.</p>
      <DebugPayloadDrawer label="payments" data={data} />
    </div>
  );
}
