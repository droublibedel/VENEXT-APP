"use client";

import { OperationalStrip } from "../../ui/OperationalStrip";

type Props = {
  globalEnabledFlagRows?: unknown;
};

export function FeatureSurfaceStatusPanel({ globalEnabledFlagRows }: Props) {
  return (
    <section className="rounded-lg border border-white/10 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Feature surface status</p>
      <OperationalStrip label="Global enabled rows">
        {String(globalEnabledFlagRows ?? "—")} enabled GLOBAL rows (inventory)
      </OperationalStrip>
      <p className="mt-2 text-[10px] text-white/45">Canonical samples drive operational gates — see Feature control.</p>
    </section>
  );
}
