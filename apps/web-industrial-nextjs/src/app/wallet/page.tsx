"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { DEMO_FINANCE_ORG, DEMO_FINANCE_WALLET } from "@/financial-feature-system/constants";
import { FinancialFeatureGate } from "@/financial-feature-system/FinancialFeatureGate";
import { useFinancialRealtime } from "@/financial-feature-system/useFinancialRealtime";
import { DynamicQrOverlay } from "@/qr-commerce/DynamicQrOverlay";
import { useQrCollapse } from "@/qr-commerce/QrCollapseController";
import { WalletOverview } from "@/wallet/components/WalletOverview";

export default function WalletPage() {
  const { collapsed, toggle } = useQrCollapse(true);
  const [qrUri, setQrUri] = useState("venext://qr/v2/loading");
  const { connected: finWs } = useFinancialRealtime(DEMO_FINANCE_ORG);

  const refreshQr = useCallback(async () => {
    const r = await fetch(`/api/core/v1/qr-commerce/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: DEMO_FINANCE_ORG,
        kind: "merchant_payment",
        currency: "XOF",
        rail: "hybrid",
      }),
    });
    if (r.ok) {
      const j = (await r.json()) as { uri: string };
      setQrUri(j.uri);
    }
    await fetch(`/api/core/v1/wallet-core/wallets/${DEMO_FINANCE_WALLET}/refresh-merchant-qr`, {
      method: "POST",
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    void refreshQr();
  }, [refreshQr]);

  return (
    <div className="min-h-dvh bg-slate-950 px-3 pb-40 pt-6 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300/90">
          Instruction 8 — portefeuille opérationnel
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Trésorerie relationnelle</h1>
        <p className="mt-2 text-sm text-slate-400">
          Paiements commerce, QR contextuels, NFC piloté par drapeaux — pas une app bancaire grand public.
        </p>
        <p className="mt-1 text-[10px] text-slate-600">
          WebSocket financier: {finWs ? "abonné" : "hors ligne"} (événements runtime)
        </p>
        <div className="mt-4">
          <FinancialFeatureGate flag="wallet_enabled" organizationId={DEMO_FINANCE_ORG}>
            <WalletOverview organizationId={DEMO_FINANCE_ORG} />
          </FinancialFeatureGate>
        </div>
        <FinancialFeatureGate flag="qr_enabled" organizationId={DEMO_FINANCE_ORG}>
          <DynamicQrOverlay collapsed={collapsed} onToggle={toggle} uri={qrUri} />
        </FinancialFeatureGate>
        <nav className="mt-8 flex flex-wrap gap-2 text-[11px]">
          <Link className="text-cyan-400 hover:underline" href="/qr-commerce">
            QR commerce
          </Link>
          <span className="text-slate-700">·</span>
          <Link className="text-cyan-400 hover:underline" href="/nfc-commerce">
            NFC
          </Link>
          <span className="text-slate-700">·</span>
          <Link className="text-cyan-400 hover:underline" href="/payment-engine">
            Orchestration
          </Link>
          <span className="text-slate-700">·</span>
          <Link className="text-cyan-400 hover:underline" href="/financial-feature-system">
            Pilotage
          </Link>
        </nav>
      </div>
    </div>
  );
}
