"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { VenextInlineError } from "commerce-humanized-errors";

import { humanizedHttpFailure, humanizedUserNotice } from "@/errors/industrial-humanized-feedback";
import { DEMO_FINANCE_ORG, DEMO_FINANCE_PRODUCT, DEMO_FINANCE_WALLET } from "@/financial-feature-system/constants";
import { FinancialFeatureGate } from "@/financial-feature-system/FinancialFeatureGate";
import { listFinancialTxQueue } from "@/payment-engine/offline-transaction-queue";
import { PaymentModeSelector } from "@/payment-engine/PaymentModeSelector";
import { TransactionHistoryStream } from "@/payment-engine/TransactionHistoryStream";

type Tx = { id: string; status: string; amount: string; type: string; createdAt: string };

export default function PaymentEnginePage() {
  const [recent, setRecent] = useState<Tx[]>([]);
  const [events, setEvents] = useState<unknown[]>([]);
  const [queue, setQueue] = useState(listFinancialTxQueue());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await fetch(`/api/core/v1/wallet-core/organizations/${DEMO_FINANCE_ORG}/overview`);
      if (r.ok) {
        const j = (await r.json()) as { wallets: { transactions: Tx[] }[] };
        const txs = j.wallets.flatMap((w) => w.transactions);
        setRecent(txs);
      }
      const e = await fetch("/api/core/v1/transaction-engine/recent-events");
      if (e.ok) setEvents((await e.json()) as unknown[]);
    })();
  }, []);

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/90">payment-engine</p>
      <h1 className="mt-2 text-xl font-semibold">Orchestration & modes</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        Moteur transactionnel côté API (signature, nonce, idempotency) + file locale brouillon pour réseaux instables.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <FinancialFeatureGate flag="payments_enabled" organizationId={DEMO_FINANCE_ORG}>
          <PaymentModeSelector productId={DEMO_FINANCE_PRODUCT} organizationId={DEMO_FINANCE_ORG} />
        </FinancialFeatureGate>
        <div>
          <p className="text-[10px] font-semibold uppercase text-slate-500">Historique récent</p>
          <TransactionHistoryStream items={recent} />
        </div>
      </div>
      <FinancialFeatureGate flag="wallet_enabled" organizationId={DEMO_FINANCE_ORG}>
        <div className="mt-6 space-y-2">
          <button
            type="button"
            className="rounded border border-emerald-800/50 bg-emerald-950/30 px-3 py-2 text-[11px] text-emerald-50"
            onClick={async () => {
              const r = await fetch("/api/core/v1/transaction-engine/initiate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  walletId: DEMO_FINANCE_WALLET,
                  organizationId: DEMO_FINANCE_ORG,
                  type: "PAYMENT",
                  amount: 1000,
                  currency: "XOF",
                  direction: "INBOUND",
                  delayMs: 400,
                }),
              });
              if (r.ok) {
                setFeedback(humanizedUserNotice("Opération enregistrée pour la démonstration."));
              } else {
                const body = await r.text().catch(() => "");
                setFeedback(humanizedHttpFailure(r.status, body));
              }
            }}
          >
            Simuler encaissement orchestré
          </button>
          <button
            type="button"
            className="ml-2 rounded border border-rose-800/50 bg-rose-950/30 px-3 py-2 text-[11px] text-rose-50"
            onClick={async () => {
              const r = await fetch("/api/core/v1/transaction-engine/initiate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  walletId: DEMO_FINANCE_WALLET,
                  organizationId: DEMO_FINANCE_ORG,
                  type: "PAYMENT",
                  amount: 500,
                  currency: "XOF",
                  direction: "INBOUND",
                  simulateFail: true,
                }),
              });
              if (r.ok) {
                setFeedback(
                  humanizedUserNotice(
                    "Simulation terminée — consultez l’historique pour le statut.",
                  ),
                );
              } else {
                const body = await r.text().catch(() => "");
                setFeedback(humanizedHttpFailure(r.status, body));
              }
            }}
          >
            Simuler échec fournisseur
          </button>
        </div>
      </FinancialFeatureGate>
      {feedback ? (
        <div className="mt-6">
          <VenextInlineError message={feedback} />
        </div>
      ) : null}
      <section className="mt-8 rounded border border-slate-800 bg-slate-900/40 p-3">
        <p className="text-[10px] font-semibold uppercase text-slate-500">Événements récents (API)</p>
        <pre className="mt-2 max-h-40 overflow-auto text-[10px] text-slate-400">{JSON.stringify(events, null, 2)}</pre>
      </section>
      <section className="mt-4 rounded border border-slate-800 bg-slate-900/40 p-3">
        <p className="text-[10px] font-semibold uppercase text-slate-500">File locale (brouillon)</p>
        <pre className="mt-2 text-[10px] text-slate-400">{JSON.stringify(queue, null, 2)}</pre>
        <button
          type="button"
          className="mt-2 text-[11px] text-cyan-400 hover:underline"
          onClick={() => setQueue(listFinancialTxQueue())}
        >
          Rafraîchir
        </button>
      </section>
      <Link href="/wallet" className="mt-8 inline-block text-sm text-cyan-400 hover:underline">
        ← Portefeuille
      </Link>
    </div>
  );
}
