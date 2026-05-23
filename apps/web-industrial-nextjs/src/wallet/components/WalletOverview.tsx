"use client";

import { useCallback, useEffect, useState } from "react";

import {
  humanizeIndustrialCaught,
  readHumanizedHttpFailure,
} from "@/errors/industrial-humanized-feedback";
import { DEMO_FINANCE_ORG } from "@/financial-feature-system/constants";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

import { WalletBalanceCard } from "./WalletBalanceCard";

type WalletRow = {
  id: string;
  organizationId: string;
  currency: string;
  balance: string;
  status: string;
  qrPayload: string;
  transactions: { id: string; status: string; amount: string; type: string; createdAt: string }[];
};

type Overview = { organizationId: string; wallets: WalletRow[] };

export function WalletOverview({ organizationId = DEMO_FINANCE_ORG }: { organizationId?: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await fetch(`/api/core/v1/wallet-core/organizations/${organizationId}/overview`);
      if (!r.ok) throw new Error(await r.text());
      setData((await r.json()) as Overview);
    } catch (e) {
      setErr(humanizeIndustrialCaught(e, { fallbackKey: "wallet_action_failed" }));
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (err) return <p className="text-sm text-rose-300">{err}</p>;
  if (!data) return <VenextInlineSkeleton variant="wallet" className="p-2" />;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {data.wallets.map((w) => (
        <div key={w.id} className="space-y-2">
          <WalletBalanceCard
            currency={w.currency}
            balance={w.balance}
            status={w.status}
            organizationId={w.organizationId}
          />
          <p className="break-all text-[9px] text-slate-600">QR: {w.qrPayload.slice(0, 80)}…</p>
        </div>
      ))}
    </div>
  );
}
