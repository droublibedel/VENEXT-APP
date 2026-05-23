export function RealtimeStrip(props: {
  enabled: boolean;
  syncMode: "live" | "fallback";
  lastLabel: string | null;
  lastUpdatedAt: string | null;
}) {
  const { enabled, syncMode, lastLabel, lastUpdatedAt } = props;
  if (!enabled) {
    return (
      <p className="text-[8px] text-amber-100/45">
        Temps réel sectoriel coupé (<span className="font-mono">relational_sector_realtime_enabled</span>).
      </p>
    );
  }
  return (
    <div className="space-y-0.5 text-[8px] text-amber-100/65">
      <p>
        Canal <span className="font-mono text-amber-300/80">relational.sector.*</span>
        {syncMode === "fallback" ? (
          <span className="ml-2 rounded border border-amber-700/50 px-1 text-amber-200/90">fallback BFF</span>
        ) : syncMode === "live" ? (
          <span className="ml-2 text-emerald-300/85">temps réel connecté</span>
        ) : null}
      </p>
      {lastLabel ? (
        <p>
          Dernier événement : <span className="font-mono text-amber-200/90">{lastLabel}</span>
        </p>
      ) : null}
      {lastUpdatedAt ? (
        <p className="font-mono text-[7px] text-amber-100/50">maj locale {lastUpdatedAt}</p>
      ) : null}
    </div>
  );
}
