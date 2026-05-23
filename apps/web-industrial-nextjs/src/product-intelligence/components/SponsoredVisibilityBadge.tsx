"use client";

type Props = { active: boolean; score?: number };

export function SponsoredVisibilityBadge({ active, score }: Props) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded border border-violet-500/40 bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-100">
      Visibilité sponsorisée
      {score != null ? (
        <span className="font-mono text-violet-200/90">{(score * 100).toFixed(0)}%</span>
      ) : null}
    </span>
  );
}
