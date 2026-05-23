"use client";

import { OperationalStrip } from "../../ui/OperationalStrip";

type Props = {
  economicSignalsLast24h?: number;
  dataQualityHighSeverity?: number;
};

export function SignalIntegrityPanel({ economicSignalsLast24h, dataQualityHighSeverity }: Props) {
  return (
    <section className="rounded-lg border border-white/10 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Signal integrity</p>
      <OperationalStrip label="Economic signals (24h)" tone={Number(dataQualityHighSeverity) > 0 ? "alert" : "ok"}>
        {String(economicSignalsLast24h ?? "—")} signals · DQ high-severity codes: {String(dataQualityHighSeverity ?? 0)}
      </OperationalStrip>
    </section>
  );
}
