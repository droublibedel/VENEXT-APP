"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DEMO_PRODUCT = "61111111-1111-1111-1111-111111111001";

export default function TraceabilityPage() {
  const [trace, setTrace] = useState<unknown>(null);
  const [recalls, setRecalls] = useState<unknown[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch(`/api/core/v1/product-traceability/products/${DEMO_PRODUCT}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`/api/core/v1/product-traceability/products/${DEMO_PRODUCT}/recalls`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ]).then(([t, rc]) => {
      setTrace(t);
      setRecalls(Array.isArray(rc) ? rc : []);
      if (!t) setErr("La traçabilité n’est pas disponible pour ce produit pour le moment.");
    });
  }, []);

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <Link href="/product-intelligence" className="text-xs text-cyan-400 hover:underline">
        ← Catalogue vivant
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Traçabilité & rappels</h1>
      <p className="mt-2 font-mono text-xs text-slate-500">Démo produit: {DEMO_PRODUCT}</p>
      {err && !trace ? <p className="mt-4 text-amber-200/90">{err}</p> : null}
      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-cyan-200/90">Fiche traçabilité</h2>
          <pre className="mt-2 max-h-[40vh] overflow-auto text-[11px] text-slate-300">
            {JSON.stringify(trace, null, 2)}
          </pre>
        </div>
        <div className="rounded-lg border border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-cyan-200/90">Rappels</h2>
          <pre className="mt-2 max-h-[40vh] overflow-auto text-[11px] text-slate-300">
            {JSON.stringify(recalls, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}
