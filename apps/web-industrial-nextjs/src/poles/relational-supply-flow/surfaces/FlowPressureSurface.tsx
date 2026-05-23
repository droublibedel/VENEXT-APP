export function FlowPressureSurface(props: { flowPressure: number; continuityPressure: number }) {
  return (
    <section className="rounded border border-amber-900/35 bg-amber-950/15 p-2">
      <h4 className="text-[9px] font-semibold uppercase tracking-wide text-amber-200/90">Pression flux corridor</h4>
      <p className="mt-1 text-[8px] text-amber-100/70">
        Pression agrégée <span className="font-mono">{props.flowPressure}</span> — continuité inverse{" "}
        <span className="font-mono">{props.continuityPressure}</span>
      </p>
    </section>
  );
}
