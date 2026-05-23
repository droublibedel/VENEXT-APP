import Link from "next/link";

export default function ProductContextRoutePage() {
  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/90">product-context</p>
      <h1 className="mt-2 text-xl font-semibold">Contexte produit ancré</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        Les fils <strong className="text-slate-200">PRODUCT_CONTEXT</strong> et{" "}
        <strong className="text-slate-200">NEGOTIATION_CONTEXT</strong> affichent la barre contextuelle produit
        (image, fournisseur, stock, paiement, termes négociés).
      </p>
      <Link className="mt-6 inline-block text-sm text-cyan-400 hover:underline" href="/commerce-messaging">
        Ouvrir le hub messagerie commerce
      </Link>
    </div>
  );
}
