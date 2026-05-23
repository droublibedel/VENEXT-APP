"use client";

import { OperationalStrip } from "../../ui/OperationalStrip";

type Props = {
  highFindings?: unknown;
  totalFindings?: unknown;
};

export function ModuleRiskStatePanel({ highFindings, totalFindings }: Props) {
  return (
    <section className="rounded-lg border border-white/10 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Module risk state</p>
      <OperationalStrip label="Data quality pressure" tone={Number(highFindings) > 0 ? "alert" : "neutral"}>
        High findings {String(highFindings ?? "—")} · total {String(totalFindings ?? "—")}
      </OperationalStrip>
    </section>
  );
}
