import type { SectorPropagationMapDto } from "@venext/shared-contracts";

export function PropagationSurface(props: { data: SectorPropagationMapDto | null }) {
  const { data } = props;
  if (!data) {
    return (
      <div className="rounded border border-amber-900/35 bg-amber-950/20 p-2">
        <p className="text-[9px] text-amber-100/50">Propagation inter-sectorielle indisponible.</p>
      </div>
    );
  }
  return (
    <div className="rounded border border-amber-800/45 bg-amber-950/25 p-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">Propagation</p>
      <p className="mt-1 font-mono text-[8px] text-amber-100/65">
        profondeur max observée {data.maxDepthObserved} — chemins {data.cascadePaths.length}
      </p>
    </div>
  );
}
