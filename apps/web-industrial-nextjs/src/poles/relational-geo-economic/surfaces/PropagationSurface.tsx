import type { GeoEconomicPropagationDto } from "@venext/shared-contracts";

export function PropagationSurface(props: { propagation: GeoEconomicPropagationDto | null }) {
  const p = props.propagation;
  if (!p) {
    return (
      <p className="text-[9px] text-amber-100/50" data-testid="geo-propagation-empty">
        Propagation territoriale — sélectionnez un corridor (relationshipId) pour la carte de cascade bornée.
      </p>
    );
  }
  return (
    <div className="rounded border border-amber-800/40 bg-slate-950/80 px-2 py-2" data-testid="geo-propagation-surface">
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">Propagation systémique</p>
      <p className="mt-1 font-mono text-[8px] text-amber-50/80">Profondeur max observée: {p.maxDepthObserved}</p>
      <ul className="mt-1 max-h-28 overflow-auto font-mono text-[7px] text-amber-100/70">
        {p.cascadePaths.slice(0, 8).map((c, i) => (
          <li key={i} className="truncate">
            impact {c.territorialImpactScore}: {c.path.join(" → ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
