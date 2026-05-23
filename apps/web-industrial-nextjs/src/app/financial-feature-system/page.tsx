"use client";

import Link from "next/link";
import { useState } from "react";

import { VenextInlineError } from "commerce-humanized-errors";

import { humanizedHttpFailure } from "@/errors/industrial-humanized-feedback";
import { DEMO_FINANCE_ORG } from "@/financial-feature-system/constants";
import { useFinancialFeatureSnapshot } from "@/financial-feature-system/useFinancialFeatureSnapshot";

export default function FinancialFeatureSystemPage() {
  const { data, reload } = useFinancialFeatureSnapshot(DEMO_FINANCE_ORG);
  const [token, setToken] = useState("");
  const [key, setKey] = useState("qr_enabled");
  const [enabled, setEnabled] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/90">financial-feature-system</p>
      <h1 className="mt-2 text-xl font-semibold">Pilotage financier runtime</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        Lecture publique du snapshot + patch protégé par{" "}
        <span className="font-mono text-slate-300">x-venext-backoffice-token</span> (défaut dev dans env).
      </p>
      <pre className="mt-4 max-h-48 overflow-auto rounded border border-slate-800 bg-slate-900/50 p-2 text-[10px] text-slate-400">
        {JSON.stringify(data, null, 2)}
      </pre>
      <button
        type="button"
        className="mt-2 text-[11px] text-cyan-400 hover:underline"
        onClick={() => void reload()}
      >
        Rafraîchir snapshot
      </button>
      <section className="mt-8 max-w-md space-y-2 rounded border border-slate-800 bg-slate-900/40 p-3">
        <p className="text-[10px] font-semibold uppercase text-slate-500">Backoffice — toggle flag</p>
        <input
          className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-[11px]"
          placeholder="Token backoffice"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <input
          className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-[11px]"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <label className="flex items-center gap-2 text-[11px] text-slate-300">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          activé
        </label>
        <button
          type="button"
          className="rounded border border-cyan-800/50 bg-cyan-950/30 px-3 py-2 text-[11px] text-cyan-50"
          onClick={async () => {
            const r = await fetch(`/api/core/v1/financial-backoffice/flags/${encodeURIComponent(key)}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "x-venext-backoffice-token": token || "dev-backoffice-token",
              },
              body: JSON.stringify({ enabled }),
            });
            if (r.ok) {
              setFeedback("Mise à jour enregistrée.");
            } else {
              const body = await r.text().catch(() => "");
              setFeedback(humanizedHttpFailure(r.status, body));
            }
            void reload();
          }}
        >
          Appliquer
        </button>
      </section>
      {feedback ? (
        <div className="mt-4">
          <VenextInlineError message={feedback} />
        </div>
      ) : null}
      <Link href="/wallet" className="mt-8 inline-block text-sm text-cyan-400 hover:underline">
        ← Portefeuille
      </Link>
    </div>
  );
}
