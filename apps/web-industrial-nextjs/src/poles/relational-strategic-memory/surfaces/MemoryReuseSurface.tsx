"use client";

import type { RelationalStrategicMemoryDto } from "@venext/shared-contracts";

export function MemoryReuseSurface(props: {
  selected: RelationalStrategicMemoryDto | null;
  onReuse: () => void;
  busy: boolean;
}) {
  const m = props.selected;
  if (!m) return <p className="text-[9px] text-slate-500">Sélectionnez une mémoire pour réutilisation analytique.</p>;
  return (
    <div className="space-y-2 text-[9px]" data-testid="memory-reuse-surface">
      <p className="text-slate-400">{m.strategicSummary}</p>
      <p className="text-slate-500">
        Réutilisations {m.reuseCount} · succès {m.successfulReuseCount} · échecs {m.failedReuseCount}
      </p>
      {m.memoryStatus === "ACTIVE" ? (
        <button
          type="button"
          disabled={props.busy}
          onClick={props.onReuse}
          className="rounded border border-cyan-800/50 bg-cyan-950/30 px-2 py-1 text-cyan-200/90 disabled:opacity-50"
          data-testid="memory-reuse-btn"
        >
          Marquer réutilisation corridor
        </button>
      ) : (
        <p className="text-slate-600">Mémoire non active — réutilisation indisponible.</p>
      )}
      <p className="text-[8px] text-slate-600">Registre explicable — capitalisation déterministe, pas apprentissage opaque.</p>
    </div>
  );
}
