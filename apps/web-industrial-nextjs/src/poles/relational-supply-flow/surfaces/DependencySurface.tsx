export function DependencySurface(props: { edgeCount: number; systemicWeight: number }) {
  return (
    <section className="rounded border border-amber-900/35 bg-amber-950/15 p-2">
      <h4 className="text-[9px] font-semibold uppercase tracking-wide text-amber-200/90">Dépendances de flux</h4>
      <p className="mt-1 text-[8px] text-amber-100/70">
        Arêtes : <span className="font-mono">{props.edgeCount}</span> — poids systémique borné{" "}
        <span className="font-mono">{props.systemicWeight}</span>
      </p>
    </section>
  );
}
