"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchGovernanceJson, patchGovernanceJson } from "../../../lib/governance-api";
import { useGovernanceShell } from "../context/GovernanceShellContext";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { DebugPayloadDrawer } from "../ui/DebugPayloadDrawer";
import { vx } from "../ui/vx-styles";

type FeatureList = {
  governedKeys: string[];
  rows: { id: string; key: string; enabled: boolean; scopeType: string; scopeValue: string | null; updatedAt: string }[];
  canonicalGlobalSamples: Record<string, { enabled: boolean; source: string; scopeMatched: string | null }>;
};

const AFFECTED: Record<string, string[]> = {
  wallet_enabled: ["wallet_core", "transaction_engine"],
  payments_enabled: ["payments", "orchestrator"],
  sponsored_products_enabled: ["relational_catalog", "sponsored_engine"],
  relationship_graph_enabled: ["relational_commerce", "graph_engine"],
  industrial_poles_enabled: ["industrial_poles", "cockpit"],
  industrial_safety_enabled: ["safety", "poles"],
};

function riskForKey(key: string, enabled: boolean) {
  if (key.includes("payment") || key.includes("wallet")) return enabled ? "MEDIUM" : "LOW";
  if (key.includes("safety")) return "HIGH";
  return "LOW";
}

export function FeatureControlScreen() {
  const { setSelection, refreshOverview } = useGovernanceShell();
  const [data, setData] = useState<FeatureList | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [auditHint, setAuditHint] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{
    key: string;
    nextEnabled: boolean;
  } | null>(null);
  const [mutating, setMutating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const res = await fetchGovernanceJson<FeatureList>("/features");
    setLoading(false);
    if (!res.ok || !res.data) {
      setErr("Unable to load feature inventory.");
      return;
    }
    setData(res.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function applyMutation() {
    if (!dialog) return;
    const key = dialog.key;
    const nextEnabled = dialog.nextEnabled;
    setMutating(true);
    setAuditHint(null);
    const res = await patchGovernanceJson<unknown>(`/features/${encodeURIComponent(key)}`, {
      enabled: nextEnabled,
      scopeType: "GLOBAL",
      scopeValue: "",
    });
    setMutating(false);
    setDialog(null);
    if (!res.ok) {
      setErr("Change was not applied. Check token and core logs.");
      return;
    }
    setAuditHint(`Governance write accepted for ${key}. Audit event recorded on core.`);
    await load();
    await refreshOverview();
  }

  if (loading) {
    return <div className="animate-pulse space-y-2 text-[12px] text-white/40">Loading feature control plane…</div>;
  }
  if (err && !data) {
    return <p className="text-[13px] text-[#FFC107]">{err}</p>;
  }
  if (!data) return null;

  const samples = data.canonicalGlobalSamples ?? {};

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Feature control center</h2>
        <p className="text-[12px] text-white/55">Canonical evaluation + GLOBAL upserts. Closed-network gates only.</p>
      </div>

      {auditHint ? (
        <div className="rounded border border-emerald-800/50 bg-emerald-950/25 px-3 py-2 text-[12px] text-emerald-100">{auditHint}</div>
      ) : null}
      {err ? <div className="rounded border border-amber-800/40 bg-amber-950/20 px-3 py-2 text-[12px] text-amber-100">{err}</div> : null}

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[720px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-white/10 bg-black/30 text-[10px] uppercase tracking-wider text-white/45">
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Evaluated</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Affected modules</th>
              <th className="px-3 py-2">Risk</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.governedKeys.map((key) => {
              const s = samples[key];
              const enabled = Boolean(s?.enabled);
              const mods = AFFECTED[key] ?? ["downstream bounded contexts"];
              return (
                <tr key={key} className="border-b border-white/[0.06] hover:bg-white/[0.03]">
                  <td className="px-3 py-2 font-mono text-[11px]" style={{ color: vx.mint }}>
                    {key}
                  </td>
                  <td className="px-3 py-2 text-white/85">{enabled ? "ON" : "OFF"}</td>
                  <td className="px-3 py-2 text-white/65">{s?.source ?? "—"}</td>
                  <td className="px-3 py-2 text-[10px] text-white/55">{mods.join(" · ")}</td>
                  <td className="px-3 py-2 text-[10px]">{riskForKey(key, enabled)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-[11px] font-medium text-white disabled:opacity-40"
                      style={{ backgroundColor: enabled ? "#6b2c3e" : vx.teal }}
                      onClick={() => {
                        setSelection({ kind: "feature", key, payload: s });
                        setDialog({ key, nextEnabled: !enabled });
                      }}
                    >
                      {enabled ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={dialog != null}
        title="Confirm governance mutation"
        body={
          dialog
            ? `Apply GLOBAL scope for «${dialog.key}» → ${dialog.nextEnabled ? "ENABLED" : "DISABLED"}. Downstream modules may lose operational paths.`
            : ""
        }
        confirmLabel="Apply gate"
        loading={mutating}
        onCancel={() => setDialog(null)}
        onConfirm={() => void applyMutation()}
      />

      <DebugPayloadDrawer label="features response" data={data} />
    </div>
  );
}
