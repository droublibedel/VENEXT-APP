"use client";

export function MemoryRealtimeStrip(props: { realtimeEnabled: boolean; lastEvent: string | null }) {
  if (!props.realtimeEnabled) {
    return (
      <p className="text-[8px] text-slate-600">
        Realtime mémoire désactivé (<span className="font-mono">relational_strategic_memory_realtime_enabled=off</span>).
      </p>
    );
  }
  return (
    <p className="text-[8px] text-slate-500" data-testid="memory-realtime-strip">
      Dernier signal mémoire : {props.lastEvent ?? "—"}
    </p>
  );
}
