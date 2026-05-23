"use client";

import { useEffect, useState } from "react";
import { fetchGovernanceJson } from "../../../lib/governance-api";
import { OperationalStrip } from "../ui/OperationalStrip";
import { DebugPayloadDrawer } from "../ui/DebugPayloadDrawer";

export function SafetyScreen() {
  const [data, setData] = useState<{
    industrialSafetyFlag: { enabled: boolean };
    connectorStatus: string;
    futureApiConnector: string;
    lastSafetySignals: unknown[];
    activeIndustrialIncidents: number;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetchGovernanceJson<typeof data>("/safety");
      if (res.ok && res.data) setData(res.data);
    })();
  }, []);

  if (!data) return <p className="text-white/40">Loading safety connector…</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Industrial safety / Bloc pompier connector</h2>
      <OperationalStrip label="Flag" tone={data.industrialSafetyFlag.enabled ? "ok" : "alert"}>
        industrial_safety_enabled = {data.industrialSafetyFlag.enabled ? "ON" : "OFF"}
      </OperationalStrip>
      <OperationalStrip label="Connector">{data.connectorStatus}</OperationalStrip>
      <OperationalStrip label="Future API">{data.futureApiConnector}</OperationalStrip>
      <OperationalStrip label="Active industrial incidents (HIGH/CRITICAL recalls)">{data.activeIndustrialIncidents}</OperationalStrip>
      <DebugPayloadDrawer label="recalls sample" data={data.lastSafetySignals} />
    </div>
  );
}
