"use client";

type Props = {
  trustLevel?: number | null;
  depth?: number;
  status?: string;
  compact?: boolean;
};

export function GraphRelationshipBadge({ trustLevel, depth, status, compact }: Props) {
  const t = trustLevel != null ? `${Math.round(trustLevel * 100)}% confiance` : null;
  const d = depth != null ? `Profondeur ${depth}` : null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border border-cyan-800/50 bg-cyan-950/50 text-cyan-100 ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      }`}
      title={[status, t, d].filter(Boolean).join(" · ")}
    >
      <span aria-hidden>◇</span>
      <span className="font-medium">Réseau</span>
      {t ? <span className="text-cyan-200/80">{t}</span> : null}
      {d ? <span className="text-cyan-200/70">{d}</span> : null}
    </span>
  );
}
