"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchGovernanceJson, patchGovernanceJson } from "../../../lib/governance-api";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useGovernanceShell } from "../context/GovernanceShellContext";
import { OperationalStrip } from "../ui/OperationalStrip";
import { DebugPayloadDrawer } from "../ui/DebugPayloadDrawer";
import { vx } from "../ui/vx-styles";

type Rel = {
  id: string;
  status: string;
  source: string;
  upstreamOrganizationId: string | null;
  downstreamOrganizationId: string | null;
  upstreamOrg: { id: string; displayName: string; commercialId: string } | null;
  downstreamOrg: { id: string; displayName: string; commercialId: string } | null;
  catalogVisibilityRows: number;
};

export function RelationshipsScreen() {
  const { setSelection } = useGovernanceShell();
  const [tab, setTab] = useState<string>("ACCEPTED");
  const [data, setData] = useState<{ relationships: Rel[]; suspiciousPatterns?: { code: string; count: number; detail: string }[] } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [suspendId, setSuspendId] = useState<string | null>(null);
  const [mut, setMut] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchGovernanceJson<{ relationships: Rel[]; suspiciousPatterns?: unknown[] }>(
      `/relationships?status=${encodeURIComponent(tab)}&take=40`,
    );
    setLoading(false);
    if (res.ok && res.data) setData(res.data as { relationships: Rel[]; suspiciousPatterns?: { code: string; count: number; detail: string }[] });
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function applySuspend() {
    if (!suspendId) return;
    setMut(true);
    const res = await patchGovernanceJson(`/relationships/${suspendId}`, { status: "SUSPENDED" });
    setMut(false);
    setSuspendId(null);
    if (!res.ok) {
      setMsg("Edge update failed.");
      return;
    }
    setMsg("Relationship suspended — audit written.");
    void load();
  }

  const tabs = ["ACCEPTED", "PENDING", "BLOCKED", "SUSPENDED"];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Relationship graph supervision</h2>
        <p className="text-[12px] text-white/55">Directional edges · visibility rows · anomaly strips.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded px-3 py-1 text-[11px] font-medium ${tab === t ? "text-white" : "text-white/45"}`}
            style={{ backgroundColor: tab === t ? vx.teal : "rgba(255,255,255,0.06)" }}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {data?.suspiciousPatterns?.length ? (
        <OperationalStrip label="Suspicious pattern density" tone="alert">
          {data.suspiciousPatterns.map((p) => (
            <span key={p.code} className="mr-3 block">
              {p.code}: {p.count} — {p.detail}
            </span>
          ))}
        </OperationalStrip>
      ) : null}

      {msg ? <div className="rounded border border-emerald-800/40 bg-emerald-950/20 px-3 py-2 text-[12px] text-emerald-100">{msg}</div> : null}
      {loading ? <p className="text-[12px] text-white/40">Loading edges…</p> : null}

      <div className="space-y-3">
        {data?.relationships.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-white/10 bg-black/25 p-3"
            onMouseEnter={() => setSelection({ kind: "relationship", id: r.id, payload: r })}
            role="presentation"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-white/45">{r.id.slice(0, 8)}…</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px]">{r.status}</span>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <OperationalStrip label="Upstream">
                {r.upstreamOrg?.displayName ?? r.upstreamOrganizationId ?? "—"}{" "}
                <span className="font-mono text-[10px] text-white/45">({r.upstreamOrg?.commercialId})</span>
              </OperationalStrip>
              <OperationalStrip label="Downstream">
                {r.downstreamOrg?.displayName ?? r.downstreamOrganizationId ?? "—"}{" "}
                <span className="font-mono text-[10px] text-white/45">({r.downstreamOrg?.commercialId})</span>
              </OperationalStrip>
            </div>
            <p className="mt-2 text-[11px] text-white/60">
              Catalog visibility rows (relationship-bound SKUs): <strong className="text-white">{r.catalogVisibilityRows}</strong> · source{" "}
              <span className="font-mono">{r.source}</span>
            </p>
            {tab === "ACCEPTED" ? (
              <button
                type="button"
                className="mt-2 rounded border border-[#FFC107]/35 px-2 py-1 text-[11px] text-[#FFC107]"
                onClick={() => setSuspendId(r.id)}
              >
                Suspend edge (governance)
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={suspendId != null}
        title="Suspend relationship edge"
        body="Moves edge to SUSPENDED — catalog lanes tied to this edge should be reviewed."
        loading={mut}
        onCancel={() => setSuspendId(null)}
        onConfirm={() => void applySuspend()}
      />

      <DebugPayloadDrawer label="relationships response" data={data} />
    </div>
  );
}
