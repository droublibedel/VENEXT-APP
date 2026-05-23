"use client";

type Props = {
  currency: string;
  balance: string;
  status: string;
  organizationId: string;
};

export function WalletBalanceCard({ currency, balance, status, organizationId }: Props) {
  return (
    <div className="rounded-lg border border-slate-800/90 bg-gradient-to-br from-slate-950 to-black px-4 py-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">Solde opérationnel</p>
      <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-slate-50">
        {balance} <span className="text-sm text-slate-400">{currency}</span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
        <span className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-slate-300">{status}</span>
        <span className="font-mono">org {organizationId.slice(0, 8)}…</span>
      </div>
    </div>
  );
}
