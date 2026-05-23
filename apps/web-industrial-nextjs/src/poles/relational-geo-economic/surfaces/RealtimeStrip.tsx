export function RealtimeStrip(props: { enabled: boolean; lastLabel: string | null }) {
  if (!props.enabled) {
    return (
      <p className="text-[8px] text-amber-200/50">
        Temps réel géo-économique désactivé (<span className="font-mono">relational_geo_economic_realtime_enabled</span>).
      </p>
    );
  }
  return (
    <div
      className="rounded border border-amber-900/40 bg-amber-950/25 px-2 py-1 font-mono text-[7px] text-amber-100/80"
      data-testid="geo-economic-realtime-strip"
    >
      <span className="text-amber-300/80">relational.geo.*</span>{" "}
      {props.lastLabel ? <span className="text-amber-50/90">{props.lastLabel}</span> : <span>en veille</span>}
    </div>
  );
}
