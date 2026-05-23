"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchGovernanceJson, patchGovernanceJson } from "../../../lib/governance-api";
import { useGovernanceShell } from "../context/GovernanceShellContext";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { DebugPayloadDrawer } from "../ui/DebugPayloadDrawer";
import { vx } from "../ui/vx-styles";

type OrgRow = {
  id: string;
  displayName: string;
  commercialId: string;
  category: string;
  verificationStatus: string;
  credibilityScore: number;
  governanceSuspended: boolean;
  relationshipEdgeCount: number;
  activeCatalogCount: number;
  productCount: number;
  featureSurface: { graph: { enabled: boolean }; wallet: { enabled: boolean }; sponsored: { enabled: boolean } };
};

type ListRes = { organizations: OrgRow[]; page: { nextCursor: string | null; hasMore: boolean } };

export function OrganizationsScreen() {
  const { setSelection, refreshOverview } = useGovernanceShell();
  const [data, setData] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<{ id: string; action: "verify" | "suspend" | "lift" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchGovernanceJson<ListRes>(`/organizations?take=48`);
    setLoading(false);
    if (res.ok && res.data) setData(res.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function applyOrg() {
    if (!pending) return;
    const id = pending.id;
    setBusy(true);
    const body =
      pending.action === "verify"
        ? { verificationStatus: "VERIFIED" as const }
        : pending.action === "suspend"
          ? { governanceSuspended: true }
          : { governanceSuspended: false };
    const res = await patchGovernanceJson(`/organizations/${id}`, body);
    setBusy(false);
    setPending(null);
    if (!res.ok) {
      setNote("La mise à jour n’a pas pu être enregistrée pour le moment.");
      return;
    }
    setNote(
      pending.action === "verify"
        ? "Verification recorded — audit trail written."
        : pending.action === "suspend"
          ? "Governance suspension applied."
          : "Suspension lifted.",
    );
    await load();
    await refreshOverview();
  }

  if (loading && !data) {
    return <div className="animate-pulse text-[12px] text-white/40">Loading ecosystem inventory…</div>;
  }
  if (!data?.organizations.length) {
    return <p className="text-[13px] text-white/55">No organizations returned.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Ecosystem organizations</h2>
        <p className="text-[12px] text-white/55">Producer / wholesaler / retailer supervision — not CRM.</p>
      </div>
      {note ? <div className="rounded border border-emerald-800/40 bg-emerald-950/20 px-3 py-2 text-[12px] text-emerald-100">{note}</div> : null}

      <div className="grid gap-3 md:grid-cols-2">
        {data.organizations.map((o) => (
          <article
            key={o.id}
            className="rounded-lg border border-white/10 bg-black/25 p-3"
            onMouseEnter={() => setSelection({ kind: "organization", id: o.id, payload: o })}
            role="presentation"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-white">{o.displayName}</p>
                <p className="font-mono text-[10px] text-white/55">{o.commercialId}</p>
              </div>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase text-white/70">{o.category}</span>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-white/65">
              <dt>Verification</dt>
              <dd>{o.verificationStatus}</dd>
              <dt>Credibility</dt>
              <dd>{o.credibilityScore.toFixed(2)}</dd>
              <dt>Relationships</dt>
              <dd>{o.relationshipEdgeCount}</dd>
              <dt>Catalogs</dt>
              <dd>{o.activeCatalogCount}</dd>
              <dt>Risk</dt>
              <dd>{o.governanceSuspended ? "SUSPENDED" : o.verificationStatus !== "VERIFIED" ? "REVIEW" : "STABLE"}</dd>
            </dl>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span style={{ color: vx.mint }}>Graph {o.featureSurface.graph.enabled ? "ON" : "OFF"}</span>
              <span className="text-white/45">·</span>
              <span>Wallet {o.featureSurface.wallet.enabled ? "ON" : "OFF"}</span>
              <span className="text-white/45">·</span>
              <span>Sponsored {o.featureSurface.sponsored.enabled ? "ON" : "OFF"}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded border border-white/15 px-2 py-1 text-[11px] text-white/85 hover:bg-white/5"
                onClick={() => setPending({ id: o.id, action: "verify" })}
              >
                Verify
              </button>
              <button
                type="button"
                className="rounded border border-[#FFC107]/35 px-2 py-1 text-[11px] text-[#FFC107]/95 hover:bg-[#FFC107]/10"
                onClick={() => setPending({ id: o.id, action: "suspend" })}
              >
                Suspend governance
              </button>
              {o.governanceSuspended ? (
                <button
                  type="button"
                  className="rounded border border-emerald-800/40 px-2 py-1 text-[11px] text-emerald-200"
                  onClick={() => setPending({ id: o.id, action: "lift" })}
                >
                  Lift suspension
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={pending != null}
        title="Confirm organization governance"
        body={
          pending?.action === "verify"
            ? "Mark organization as VERIFIED — downstream catalog gates may tighten."
            : pending?.action === "suspend"
              ? "Governance suspension isolates this actor from operational lanes."
              : "Lift governance suspension — restore operational eligibility."
        }
        loading={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => void applyOrg()}
      />

      <DebugPayloadDrawer label="organizations page" data={data} />
    </div>
  );
}
