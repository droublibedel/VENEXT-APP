"use client";

import { OperationalStrip } from "../../ui/OperationalStrip";

type Props = {
  windowHours?: unknown;
  count?: unknown;
};

export function EconomicSignalFlowPanel({ windowHours, count }: Props) {
  return (
    <section className="rounded-lg border border-white/10 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Economic signal flow</p>
      <OperationalStrip label="Window">
        {String(windowHours ?? 24)}h · count {String(count ?? "—")}
      </OperationalStrip>
    </section>
  );
}
