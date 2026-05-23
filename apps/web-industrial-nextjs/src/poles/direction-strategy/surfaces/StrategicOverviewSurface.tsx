"use client";

type Capsules = Record<
  string,
  { score?: number; ratio?: number; index?: number; interpretation?: string; note?: string; marker?: string; trajectory?: string; label?: string }
>;

export function StrategicOverviewSurface({ data }: { data: unknown }) {
  const o = data as { strategicCapsules?: Capsules; generatedAt?: string } | null;
  if (!o?.strategicCapsules) {
    return <p className="text-xs text-slate-500">Strategic overview unavailable (policy or connectivity).</p>;
  }
  const c = o.strategicCapsules;
  const keys = [
    ["strategicHealth", "Strategic health"],
    ["marketExpansionVelocity", "Market expansion velocity"],
    ["networkGrowth", "Network growth"],
    ["distributionTension", "Distribution tension"],
    ["abnormalSignalDensity", "Abnormal signal density"],
    ["productPressureState", "Product pressure state"],
    ["sponsorshipImpact", "Sponsorship impact"],
    ["relationshipStability", "Relationship stability"],
    ["regionOpportunityLevel", "Region opportunity"],
    ["industrialConfidenceState", "Industrial confidence"],
  ] as const;

  return (
    <section className="space-y-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">Strategic overview</p>
        <p className="text-xs text-slate-500">Interpreted industrial posture — not sales KPIs.</p>
      </header>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {keys.map(([k, label]) => {
          const cap = c[k] as Record<string, unknown> | undefined;
          if (!cap) return null;
          const val =
            k === "networkGrowth" && cap.acceptedEdges != null
              ? `${String(cap.acceptedEdges)} acc / ${String(cap.pendingEdges)} pend`
              : (cap.score ?? cap.ratio ?? cap.index ?? cap.marker ?? "—");
          const sub =
            (cap.interpretation as string) ||
            (cap.note as string) ||
            (cap.trajectory as string) ||
            (cap.tensionIndicator as string) ||
            (cap.anomalyMarker as string) ||
            (k === "networkGrowth" ? (cap.marker as string) : "") ||
            "";
          return (
            <div
              key={k}
              className="rounded border border-slate-800/90 bg-slate-950/80 px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 font-mono text-sm text-slate-100">
                {typeof val === "number" ? val.toFixed(3) : String(val)}
              </p>
              {sub ? <p className="mt-1 text-[11px] leading-snug text-slate-400">{sub}</p> : null}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-600">Generated {o.generatedAt ?? "—"}</p>
    </section>
  );
}
