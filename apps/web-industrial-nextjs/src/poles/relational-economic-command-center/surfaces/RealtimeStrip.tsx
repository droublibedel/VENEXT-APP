"use client";

export function RealtimeStrip(props: {
  realtimeEnabled: boolean;
  lastRealtimeLabel: string | null;
}) {
  const { realtimeEnabled, lastRealtimeLabel } = props;
  if (!realtimeEnabled) {
    return (
      <p className="text-[8px] text-slate-600">
        Flux commande relationnel désactivé (<span className="font-mono">relational_economic_command_center_realtime_enabled</span>).
      </p>
    );
  }
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded border border-indigo-900/35 bg-indigo-950/20 px-2 py-1.5"
      data-testid="relational-command-realtime-strip"
    >
      <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-indigo-200/90">Bus supervision</span>
      <span className="truncate font-mono text-[8px] text-indigo-100/95">
        {lastRealtimeLabel ?? "En attente d'événements relatifs au centre de supervision corridor…"}
      </span>
    </div>
  );
}
