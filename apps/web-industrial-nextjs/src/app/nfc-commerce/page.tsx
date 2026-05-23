import Link from "next/link";

import { NfcReadyIndicator } from "@/nfc-commerce/NfcReadyIndicator";

export default function NfcCommercePage() {
  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/90">nfc-commerce</p>
      <h1 className="mt-2 text-xl font-semibold">Couche NFC prête</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        Détection capacité + intention de paiement signée — aucun SDK fournisseur codé en dur. Activation via{" "}
        <span className="font-mono text-slate-300">nfc_enabled</span>.
      </p>
      <div className="mt-4 max-w-sm">
        <NfcReadyIndicator />
      </div>
      <Link href="/wallet" className="mt-8 inline-block text-sm text-cyan-400 hover:underline">
        ← Portefeuille
      </Link>
    </div>
  );
}
