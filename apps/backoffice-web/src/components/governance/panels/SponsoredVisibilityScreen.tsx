"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchGovernanceJson, patchGovernanceJson } from "../../../lib/governance-api";
import { useGovernanceShell } from "../context/GovernanceShellContext";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { OperationalStrip } from "../ui/OperationalStrip";
import { DebugPayloadDrawer } from "../ui/DebugPayloadDrawer";

type Inj = {
  id: string;
  active: boolean;
  targetCommercialCategory: string;
  relevanceFloor: number;
  maxRelationshipDepth: number;
  sponsor: { displayName: string; commercialId: string; country?: string | null; city?: string | null };
  product: { name: string; sponsorEligible: boolean };
  policyReasons: string[];
};

export function SponsoredVisibilityScreen() {
  const { setSelection, refreshOverview } = useGovernanceShell();
  const [data, setData] = useState<{ injections: Inj[]; featureFlag: { enabled: boolean }; canonicalActiveLane: unknown } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ id: string; action: "approve" | "pause" | "reject" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchGovernanceJson<typeof data>("/sponsored-visibility?take=60");
    setLoading(false);
    if (res.ok && res.data) setData(res.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function apply() {
    if (!dialog) return;
    const id = dialog.id;
    const action = dialog.action;
    setBusy(true);
    const res = await patchGovernanceJson(`/sponsored-visibility/${id}`, { action, note: `governance:${action}` });
    setBusy(false);
    setDialog(null);
    if (!res.ok) {
      setHint("Injection update failed.");
      return;
    }
    setHint(`Injection ${action} — sponsor identity preserved in ledger; no marketplace substitution.`);
    await load();
    await refreshOverview();
  }

  if (loading && !data) return <p className="text-[12px] text-white/40">Loading sponsored governance…</p>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Sponsored visibility governance</h2>
        <p className="text-[12px] text-white/55">
          Relationship-bound injection only — explicit sponsor identity · no open-market ads · no price comparison ranking.
        </p>
      </div>

      <OperationalStrip label="Platform gate" tone={data.featureFlag.enabled ? "ok" : "alert"}>
        sponsored_products_enabled = {data.featureFlag.enabled ? "ON" : "OFF"} — canonical engine evaluates targeting.
      </OperationalStrip>

      {hint ? <div className="rounded border border-emerald-800/40 bg-emerald-950/20 px-3 py-2 text-[12px] text-emerald-100">{hint}</div> : null}

      <div className="grid gap-3 md:grid-cols-2">
        {data.injections.map((i) => (
          <article
            key={i.id}
            className="rounded-lg border border-white/10 bg-black/25 p-3"
            onMouseEnter={() => setSelection({ kind: "sponsored", id: i.id, payload: i })}
            role="presentation"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Sponsor</p>
            <p className="font-medium text-white">{i.sponsor.displayName}</p>
            <p className="font-mono text-[10px] text-white/55">{i.sponsor.commercialId}</p>
            <dl className="mt-2 space-y-1 text-[11px] text-white/70">
              <div className="flex justify-between gap-2">
                <dt>Target category</dt>
                <dd className="font-mono">{i.targetCommercialCategory}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Geo</dt>
                <dd>
                  {[i.sponsor.city, i.sponsor.country].filter(Boolean).join(", ") || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Relevance floor</dt>
                <dd>{i.relevanceFloor}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Graph depth cap</dt>
                <dd>{i.maxRelationshipDepth}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Policy pressure</dt>
                <dd>{i.policyReasons.join(" · ") || "CLEAR"}</dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded bg-emerald-900/50 px-2 py-1 text-[11px] text-emerald-100"
                onClick={() => setDialog({ id: i.id, action: "approve" })}
              >
                Approve lane
              </button>
              <button
                type="button"
                className="rounded border border-[#FFC107]/40 px-2 py-1 text-[11px] text-[#FFC107]"
                onClick={() => setDialog({ id: i.id, action: "pause" })}
              >
                Pause
              </button>
              <button
                type="button"
                className="rounded border border-red-900/50 px-2 py-1 text-[11px] text-red-300/90"
                onClick={() => setDialog({ id: i.id, action: "reject" })}
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={dialog != null}
        title="Sponsored injection governance"
        body={
          dialog
            ? `Apply «${dialog.action}» to injection ${dialog.id.slice(0, 8)}… — audit event will record actor and state.`
            : ""
        }
        loading={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() => void apply()}
      />

      <DebugPayloadDrawer label="canonical active lane (engine)" data={data.canonicalActiveLane} />
      <DebugPayloadDrawer label="sponsored governance response" data={data} />
    </div>
  );
}
