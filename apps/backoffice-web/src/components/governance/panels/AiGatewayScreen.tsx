"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchGovernanceJson, patchGovernanceJson } from "../../../lib/governance-api";
import { OperationalStrip } from "../ui/OperationalStrip";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { DebugPayloadDrawer } from "../ui/DebugPayloadDrawer";

type Snap = {
  activeProvider: string;
  mockLatencyMs: number;
  poleInsightGeneration: string;
  externalSignalProviders: string[];
  lastGeneratedInsightAt: string | null;
  confidenceAverage: number;
  failedInsightCalls: number;
  futureProviders?: string[];
  note?: string;
};

export function AiGatewayScreen() {
  const [data, setData] = useState<Snap | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmMock, setConfirmMock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchGovernanceJson<Snap>("/ai-gateway");
    setLoading(false);
    if (res.ok && res.data) setData(res.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function applyLatency() {
    setBusy(true);
    const res = await patchGovernanceJson("/ai-gateway", {
      mockLatencyMs: Math.min(400, (data?.mockLatencyMs ?? 120) + 40),
      poleInsightGeneration: data?.poleInsightGeneration === "ENABLED" ? "DEGRADED" : "ENABLED",
    });
    setBusy(false);
    setConfirmMock(false);
    if (!res.ok) {
      setNote("La modification n’a pas pu être appliquée pour le moment.");
      return;
    }
    setNote("Mock provider telemetry updated — audit attached.");
    await load();
  }

  if (loading && !data) return <p className="text-white/40">Loading AI gateway state…</p>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">AI gateway governance</h2>
      <p className="text-[12px] text-white/55">MockAIProvider only — no outbound LLM · pole insight health tracked in-process.</p>
      {note ? <div className="rounded border border-emerald-900/40 px-3 py-2 text-[12px] text-emerald-100">{note}</div> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <OperationalStrip label="Active provider">{data.activeProvider}</OperationalStrip>
        <OperationalStrip label="Pole insight">{data.poleInsightGeneration}</OperationalStrip>
        <OperationalStrip label="Mock latency (ms)">{data.mockLatencyMs}</OperationalStrip>
        <OperationalStrip label="Confidence avg">{data.confidenceAverage.toFixed(3)}</OperationalStrip>
        <OperationalStrip label="Failed insight calls">{data.failedInsightCalls}</OperationalStrip>
        <OperationalStrip label="Last insight at">{data.lastGeneratedInsightAt ?? "—"}</OperationalStrip>
      </div>

      <OperationalStrip label="External signal providers">{data.externalSignalProviders.join(" · ")}</OperationalStrip>
      <OperationalStrip label="Future adapters">{data.futureProviders?.join(" · ") ?? "—"}</OperationalStrip>
      <p className="text-[11px] text-white/45">{data.note}</p>

      <button
        type="button"
        className="rounded border border-white/15 px-3 py-1.5 text-[12px] text-white/85 hover:bg-white/5"
        onClick={() => setConfirmMock(true)}
      >
        Toggle insight health / bump mock latency
      </button>

      <ConfirmDialog
        open={confirmMock}
        title="Adjust mock AI gateway"
        body="Cycles pole insight between ENABLED/DEGRADED and increases mock latency slightly — no external calls."
        loading={busy}
        onCancel={() => setConfirmMock(false)}
        onConfirm={() => void applyLatency()}
      />

      <DebugPayloadDrawer label="ai-gateway" data={data} />
    </div>
  );
}
