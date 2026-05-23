"use client";

import type { ReactNode } from "react";
import type { FinanceOverviewResponse } from "@venext/shared-contracts";

export function FinanceOverview({ data }: { data: FinanceOverviewResponse | undefined }) {
  if (!data || data.policy === "DISABLED") {
    return <Panel title="Finance overview" muted="Pole disabled or loading…" />;
  }
  const caps = [
    { k: "Receivables pressure", v: data.receivablesPressure.toFixed(2) },
    { k: "Overdue pressure", v: data.overduePressure.toFixed(2) },
    { k: "Payment reliability", v: data.paymentReliability.toFixed(2) },
    { k: "Unstable accounts", v: String(data.unstableAccounts) },
    { k: "Delayed collections", v: String(data.delayedCollections) },
    { k: "Wallet liquidity", v: data.walletLiquidityState },
    { k: "Downstream solvency", v: data.downstreamSolvency.toFixed(2) },
    { k: "Execution confidence", v: data.paymentExecutionConfidence.toFixed(2) },
    { k: "Credit exposure", v: data.creditExposure.toFixed(2) },
    { k: "Financial instability", v: data.financialInstability.toFixed(2) },
  ];
  return (
    <Panel title="Finance overview" subtitle={data.headline}>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-5">
        {caps.map((c) => (
          <div key={c.k} className="rounded border border-rose-900/35 bg-slate-950/60 px-2 py-1.5">
            <p className="text-[9px] uppercase tracking-wide text-rose-200/70">{c.k}</p>
            <p className="font-mono text-sm text-slate-100">{c.v}</p>
          </div>
        ))}
      </div>
      {data.territoryStressTop.length ? (
        <p className="mt-2 text-[10px] text-slate-500">Territory stress: {data.territoryStressTop.join(" · ")}</p>
      ) : null}
    </Panel>
  );
}

function Panel({ title, subtitle, children, muted }: { title: string; subtitle?: string; children?: ReactNode; muted?: string }) {
  return (
    <section className="rounded border border-slate-800 bg-slate-950/50 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-200/90">{title}</h3>
      {subtitle ? <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p> : null}
      {muted && !children ? <p className="mt-2 text-[11px] text-slate-500">{muted}</p> : null}
      {children}
    </section>
  );
}
