"use client";

export function EconomicRealtimeStrip(props: { realtimeEnabled: boolean; lastRealtimeEvent?: string | null }) {
  if (!props.realtimeEnabled) {
    return (
      <p className="text-[8px] text-slate-600">
        Realtime graphe économique désactivé (
        <span className="font-mono">relational_economic_signal_graph_realtime_enabled=off</span>).
      </p>
    );
  }
  if (!props.lastRealtimeEvent) {
    return <p className="text-[8px] text-slate-600">En attente signaux relational.economic.*</p>;
  }
  return (
    <p className="text-[8px] text-amber-200/80" data-testid="economic-realtime-strip">
      Dernier signal: {props.lastRealtimeEvent}
    </p>
  );
}
