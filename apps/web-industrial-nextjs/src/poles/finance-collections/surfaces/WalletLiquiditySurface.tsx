"use client";

import type { WalletLiquiditySurfaceResponse } from "@venext/shared-contracts";

export function WalletLiquiditySurface({ data }: { data: WalletLiquiditySurfaceResponse | undefined }) {
  if (!data || data.policy === "DISABLED") {
    return <p className="rounded border border-slate-800 bg-slate-950/50 p-3 text-[11px] text-slate-500">Wallet / liquidity — disabled.</p>;
  }
  return (
    <section className="rounded border border-slate-800 bg-slate-950/50 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-200/90">Wallet / liquidity</h3>
      <p className="mt-1 text-[10px] text-amber-200/90">
        providerMode: <span className="font-mono">{data.providerMode}</span> · stress index {data.liquidityStressIndex.toFixed(2)}
      </p>
      <ul className="mt-2 max-h-28 space-y-1 overflow-auto text-[10px] text-slate-300">
        {data.wallets.slice(0, 8).map((w) => (
          <li key={`${w.organizationId}-${w.currency}`} className="font-mono">
            {w.organizationId.slice(0, 8)}… · {w.balance.toFixed(0)} {w.currency} · QR {w.qrReadiness.toFixed(2)} · NFC{" "}
            {w.nfcReadiness.toFixed(2)}
          </li>
        ))}
      </ul>
    </section>
  );
}
