"use client";

export function RealtimeStrip(props: { realtimeEnabled: boolean; lastRealtimeLabel: string | null }) {
  if (!props.realtimeEnabled) {
    return (
      <p className="text-[8px] text-slate-600">
        Temps réel pression désactivé (<span className="font-mono">relational_economic_pressure_realtime_enabled</span>).
      </p>
    );
  }
  return (
    <div className="rounded border border-orange-900/40 bg-orange-950/20 px-2 py-1.5 font-mono text-[8px] text-orange-100/90">
      <span className="font-semibold uppercase tracking-[0.2em]">Bus pression</span>{" "}
      <span className="text-orange-50">
        {props.lastRealtimeLabel ?? "En attente d'événements relational.pressure…"}
      </span>
    </div>
  );
}
