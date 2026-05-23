import Link from "next/link";

export default function ProductEconomyPage() {
  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <Link href="/product-intelligence" className="text-xs text-cyan-400 hover:underline">
        ← Catalogue vivant
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Économie produit</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Les indicateurs d’énergie marché, de tension et de température commerciale sont rendus par SKU sur le
        catalogue vivant et sur l’API{" "}
        <code className="rounded bg-slate-900 px-1 text-cyan-200/90">
          /v1/product-signals/products/:id/market-energy
        </code>
        .
      </p>
      <ul className="mt-6 list-inside list-disc text-sm text-slate-300">
        <li>Pas de fil social type vanity — signaux opérationnels uniquement.</li>
        <li>Température commerciale dérivée des états économiques persistés.</li>
        <li>Compatible réseaux relationnels — pas d’agrégation marketplace.</li>
      </ul>
    </div>
  );
}
