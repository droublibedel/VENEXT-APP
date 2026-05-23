"use client";

import Link from "next/link";
import { useState } from "react";

import { DEMO_FINANCE_ORG } from "@/financial-feature-system/constants";
import { FinancialFeatureGate } from "@/financial-feature-system/FinancialFeatureGate";
import { DynamicQrOverlay } from "@/qr-commerce/DynamicQrOverlay";
import { useQrCollapse } from "@/qr-commerce/QrCollapseController";

export default function QrCommercePage() {
  const { collapsed, toggle } = useQrCollapse(false);
  const [uri, setUri] = useState("");

  return (
    <div className="min-h-dvh bg-slate-950 px-3 pb-44 pt-6 text-slate-100">
      <div className="mx-auto max-w-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/90">qr-commerce</p>
        <h1 className="mt-2 text-xl font-semibold">Moteur QR contextuel</h1>
        <p className="mt-2 text-sm text-slate-400">
          QR dynamique signé (v2) — rails wallet / externe / hybride. Le calque peut recouvrir le catalogue sans le
          remplacer.
        </p>
        <FinancialFeatureGate flag="qr_enabled" organizationId={DEMO_FINANCE_ORG}>
          <button
            type="button"
            className="mt-4 rounded border border-cyan-700/50 bg-cyan-950/30 px-3 py-2 text-[12px] text-cyan-50"
            onClick={async () => {
              const r = await fetch(`/api/core/v1/qr-commerce/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  organizationId: DEMO_FINANCE_ORG,
                  kind: "product_linked",
                  currency: "XOF",
                  productId: "61111111-1111-1111-1111-111111111001",
                  amountMinor: 41000000,
                  rail: "hybrid",
                }),
              });
              if (r.ok) {
                const j = (await r.json()) as { uri: string };
                setUri(j.uri);
              }
            }}
          >
            Générer QR produit (démo)
          </button>
        </FinancialFeatureGate>
        {uri ? <DynamicQrOverlay collapsed={collapsed} onToggle={toggle} uri={uri} label="QR produit lié" /> : null}
        <Link href="/wallet" className="mt-8 inline-block text-sm text-cyan-400 hover:underline">
          ← Portefeuille
        </Link>
      </div>
    </div>
  );
}
