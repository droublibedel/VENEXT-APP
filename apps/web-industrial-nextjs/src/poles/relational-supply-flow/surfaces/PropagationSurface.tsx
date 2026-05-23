export function PropagationSurface(props: { maxDepth: number; chainCount: number }) {
  return (
    <section className="rounded border border-orange-900/40 bg-orange-950/20 p-2">
      <h4 className="text-[9px] font-semibold uppercase tracking-wide text-orange-200/90">Propagation</h4>
      <p className="mt-1 text-[8px] text-orange-100/70">
        Profondeur max observée <span className="font-mono">{props.maxDepth}</span> — chaînes{" "}
        <span className="font-mono">{props.chainCount}</span>
      </p>
    </section>
  );
}
