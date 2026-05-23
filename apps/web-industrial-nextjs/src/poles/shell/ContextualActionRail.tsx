"use client";

type Props = {
  lowBandwidth: boolean;
  lowAnimation: boolean;
  onToggleBandwidth: (v: boolean) => void;
  onToggleAnimation: (v: boolean) => void;
  onRefreshInsight: () => void;
  aiRefreshing?: boolean;
};

/** Command rail — operational toggles, not CRUD forms (Instruction 5 §2C). */
export function ContextualActionRail({
  lowBandwidth,
  lowAnimation,
  onToggleBandwidth,
  onToggleAnimation,
  onRefreshInsight,
  aiRefreshing = false,
}: Props) {
  return (
    <aside className="flex h-full flex-col gap-2 rounded-md border border-slate-800/90 bg-slate-950/90 p-2 text-[11px] text-slate-200 md:p-3">
      <p className="font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
        Command rail
      </p>
      <button
        type="button"
        disabled={aiRefreshing}
        onClick={onRefreshInsight}
        className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-2 text-left font-medium text-cyan-50 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {aiRefreshing ? "Regenerating…" : "Regenerate interpretive summary (mock)"}
      </button>
      <label className="flex cursor-pointer items-center gap-2 rounded border border-slate-800 px-2 py-2 hover:border-slate-600">
        <input
          type="checkbox"
          checked={lowBandwidth}
          onChange={(e) => onToggleBandwidth(e.target.checked)}
        />
        <span>Low bandwidth mode</span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 rounded border border-slate-800 px-2 py-2 hover:border-slate-600">
        <input
          type="checkbox"
          checked={lowAnimation}
          onChange={(e) => onToggleAnimation(e.target.checked)}
        />
        <span>Low animation mode</span>
      </label>
      <div className="mt-auto rounded border border-slate-800/80 bg-black/40 p-2 text-[10px] text-slate-500">
        Filters + AI entrypoints wire here. No ERP record panels.
      </div>
    </aside>
  );
}
