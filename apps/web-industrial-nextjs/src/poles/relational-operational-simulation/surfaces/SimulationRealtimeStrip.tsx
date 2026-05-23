"use client";

export function SimulationRealtimeStrip(props: { realtimeEnabled: boolean; lastEvent: string | null }) {
  return (
    <div className="rounded border border-slate-800/80 px-2 py-1.5 text-[8px] text-slate-500" data-testid="simulation-realtime-strip">
      Temps réel{" "}
      {props.realtimeEnabled ? (
        <span className="text-cyan-300/80">
          {props.lastEvent ? `— ${props.lastEvent}` : "— en écoute relational.operational.simulation_*"}
        </span>
      ) : (
        <span className="font-mono">relational_operational_simulation_realtime_enabled=off</span>
      )}
    </div>
  );
}
