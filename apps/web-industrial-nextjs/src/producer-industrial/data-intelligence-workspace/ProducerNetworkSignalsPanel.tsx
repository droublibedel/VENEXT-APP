"use client";

import { memo, useRef, useState } from "react";

import type { IntelligencePanelProps, NetworkSignalCard, ProducerIntelligenceWorkspaceView } from "./producer-intelligence.types";
import { ProducerIntelligencePanelFrame } from "./ProducerIntelligencePanelFrame";

const ROW_H = 56;

function VirtualSignalsList(props: { rows: NetworkSignalCard[] }) {
  const { rows } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const start = Math.floor(scrollTop / ROW_H);
  const slice = rows.slice(start, start + 8);
  const offset = start * ROW_H;

  return (
    <div
      ref={ref}
      className="max-h-[360px] overflow-y-auto"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      data-testid="intelligence-network-signals-list"
    >
      <div style={{ height: rows.length * ROW_H, position: "relative" }}>
        <ul className="absolute w-full space-y-2" style={{ top: offset }}>
          {slice.map((s) => (
            <li
              key={s.id}
              className={`rounded border px-3 py-2 ${
                s.tone === "caution"
                  ? "border-amber-500/25 bg-amber-950/10"
                  : s.tone === "signal"
                    ? "border-emerald-500/20 bg-emerald-950/8"
                    : "border-slate-800/60 bg-slate-950/40"
              }`}
              data-testid={`network-signal-${s.id}`}
              style={{ minHeight: ROW_H - 8 }}
            >
              <p className="text-sm text-slate-100">{s.line1}</p>
              {s.line2 ? <p className="mt-0.5 text-[11px] text-slate-500">{s.line2}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function NetworkSignalsInner(
  props: IntelligencePanelProps & { view: ProducerIntelligenceWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const signals = view?.networkSignals ?? [];

  return (
    <ProducerIntelligencePanelFrame
      title="Signaux réseau"
      subtitle="Petites lectures utiles — maximum deux lignes"
      loading={loading}
      error={error}
      empty={!signals.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-network-signals-panel"
    >
      <VirtualSignalsList rows={signals} />
    </ProducerIntelligencePanelFrame>
  );
}

export const ProducerNetworkSignalsPanel = memo(NetworkSignalsInner);
