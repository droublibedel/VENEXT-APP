"use client";

import { OperationalStrip } from "../../ui/OperationalStrip";

type Props = {
  dataQualityCodes?: string[];
};

export function DataQualitySummaryPanel({ dataQualityCodes }: Props) {
  return (
    <section className="rounded-lg border border-white/10 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Data quality summary</p>
      <OperationalStrip label="Codes (24h window ref.)">
        {(dataQualityCodes ?? []).slice(0, 4).join(", ") || "—"}
      </OperationalStrip>
      <p className="mt-2 text-[10px] text-white/45">Open Data quality for remediation detail.</p>
    </section>
  );
}
