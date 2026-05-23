export function RealtimeStrip(props: {
  enabled: boolean;
  syncMode: "live" | "fallback";
  lastLabel: string | null;
  lastUpdatedAt: string | null;
}) {
  const { enabled, syncMode, lastLabel, lastUpdatedAt } = props;
  if (!enabled) {
    return (
      <p className="text-[8px] text-orange-100/45">
        Temps réel supply-flow coupé (<span className="font-mono">relational_supply_flow_realtime_enabled</span>).
      </p>
    );
  }
  return (
    <div className="space-y-0.5 text-[8px] text-orange-100/70">
      <p>
        Canal <span className="font-mono text-orange-300/85">relational.supply.*</span>
        {syncMode === "fallback" ? (
          <span className="ml-2 rounded border border-orange-700/50 px-1 text-orange-200/90">fallback BFF</span>
        ) : (
          <span className="ml-2 text-emerald-300/85">temps réel connecté</span>
        )}
      </p>
      {lastLabel ? (
        <p>
          Dernier événement : <span className="font-mono text-orange-200/90">{lastLabel}</span>
        </p>
      ) : null}
      {lastUpdatedAt ? <p className="font-mono text-[7px] text-orange-100/50">maj locale {lastUpdatedAt}</p> : null}
    </div>
  );
}
