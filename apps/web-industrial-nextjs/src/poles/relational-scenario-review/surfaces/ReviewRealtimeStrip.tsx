"use client";

export function ReviewRealtimeStrip(props: { realtimeEnabled: boolean; lastEvent: string | null }) {
  if (!props.realtimeEnabled) {
    return (
      <p className="text-[8px] text-slate-600">
        Realtime revue désactivé (<span className="font-mono">relational_scenario_review_realtime_enabled=off</span>).
      </p>
    );
  }
  return (
    <p className="text-[8px] text-slate-500" data-testid="review-realtime-strip">
      Dernier signal revue : {props.lastEvent ?? "—"}
    </p>
  );
}
