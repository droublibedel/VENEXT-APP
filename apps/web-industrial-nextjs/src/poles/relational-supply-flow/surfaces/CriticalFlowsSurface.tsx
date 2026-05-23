export function CriticalFlowsSurface(props: { count: number }) {
  return (
    <section className="rounded border border-orange-800/45 bg-orange-950/30 p-2">
      <h4 className="text-[9px] font-semibold uppercase tracking-wide text-orange-100/95">Flux critiques</h4>
      <p className="mt-1 text-[8px] text-orange-100/70">
        Signaux corridor à risque élevé : <span className="font-mono">{props.count}</span>
      </p>
    </section>
  );
}
