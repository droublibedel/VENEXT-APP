export function BottleneckSurface(props: { count: number }) {
  return (
    <section className="rounded border border-orange-800/40 bg-orange-950/25 p-2">
      <h4 className="text-[9px] font-semibold uppercase tracking-wide text-orange-200/90">Goulets d’écoulement</h4>
      <p className="mt-1 text-[8px] text-orange-100/70">
        Lectures infrastructurelles actives : <span className="font-mono">{props.count}</span>
      </p>
    </section>
  );
}
