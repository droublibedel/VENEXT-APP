"use client";

export function RelationshipIntelligenceSurface({ data }: { data: unknown }) {
  const r = data as {
    graphReuse?: string;
    acceptedCount?: number;
    pendingInvitations?: number;
    unstableRelationships?: number;
    suspendedRelationships?: number;
    qrRelationshipGrowth30d?: number;
    contactSyncRelationshipGrowth30d?: number;
    trustEvolution?: { trend: string; delta: number };
    commercialDependencyScore?: number;
    relationshipStrengthIndex?: number;
    suggestionEngineSample?: { mutualContactClusters: number; graphSuggestions: number };
  } | null;

  if (!r) return <p className="text-xs text-slate-500">Relationship intelligence unavailable.</p>;

  return (
    <section className="space-y-2">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Relationship intelligence</p>
        <p className="text-xs text-slate-500">
          Graph engine: <span className="font-mono text-slate-400">{r.graphReuse ?? "—"}</span>
        </p>
      </header>
      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 md:grid-cols-3">
        <Metric label="Accepted" value={r.acceptedCount} />
        <Metric label="Pending" value={r.pendingInvitations} />
        <Metric label="Unstable" value={r.unstableRelationships} />
        <Metric label="Suspended" value={r.suspendedRelationships} />
        <Metric label="QR growth 30d" value={r.qrRelationshipGrowth30d} />
        <Metric label="Contact-sync 30d" value={r.contactSyncRelationshipGrowth30d} />
        <div className="col-span-2 md:col-span-3 rounded border border-slate-800/80 bg-slate-950/50 px-2 py-1.5">
          <span className="text-slate-600">Trust evolution · </span>
          <span className="font-mono text-cyan-200/80">{r.trustEvolution?.trend}</span>
          <span className="text-slate-600"> Δ{r.trustEvolution?.delta}</span>
        </div>
        <Metric label="Dependency" value={r.commercialDependencyScore} fmt="pct" />
        <Metric label="Strength index" value={r.relationshipStrengthIndex} fmt="pct" />
        {r.suggestionEngineSample ? (
          <div className="col-span-2 text-[10px] text-slate-600 md:col-span-3">
            Suggestion engine sample: mutual clusters {r.suggestionEngineSample.mutualContactClusters} · graph suggestions{" "}
            {r.suggestionEngineSample.graphSuggestions}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Metric({ label, value, fmt }: { label: string; value?: number; fmt?: "pct" }) {
  const v =
    value == null
      ? "—"
      : fmt === "pct"
        ? value.toFixed(2)
        : String(value);
  return (
    <div className="rounded border border-slate-800/60 px-2 py-1">
      <p className="text-[9px] uppercase tracking-wide text-slate-600">{label}</p>
      <p className="font-mono text-slate-200">{v}</p>
    </div>
  );
}
