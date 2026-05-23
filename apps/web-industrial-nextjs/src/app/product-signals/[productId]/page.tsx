"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  humanizeIndustrialCaught,
  humanizedHttpFailure,
} from "@/errors/industrial-humanized-feedback";

export default function ProductSignalsPage() {
  const params = useParams();
  const productId = String(params.productId ?? "");
  const [discussion, setDiscussion] = useState<unknown>(null);
  const [energy, setEnergy] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    void Promise.all([
      fetch(`/api/core/v1/product-signals/products/${productId}/discussion`).then(async (r) => {
        if (!r.ok) throw new Error(humanizedHttpFailure(r.status));
        return r.json();
      }),
      fetch(`/api/core/v1/product-signals/products/${productId}/market-energy`).then(async (r) => {
        if (!r.ok) throw new Error(humanizedHttpFailure(r.status));
        return r.json();
      }),
    ])
      .then(([d, e]) => {
        if (!cancelled) {
          setDiscussion(d);
          setEnergy(e);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setErr(humanizeIndustrialCaught(e, { fallbackKey: "catalog_unavailable" }));
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <Link href="/product-intelligence" className="text-xs text-cyan-400 hover:underline">
        ← Catalogue vivant
      </Link>
      <h1 className="mt-4 text-xl font-semibold">Signaux produit</h1>
      <p className="mt-1 font-mono text-xs text-slate-500">{productId}</p>
      {err ? <p className="mt-4 text-sm text-rose-300">{err}</p> : null}
      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-cyan-200/90">Discussion / négociation</h2>
          <pre className="mt-2 max-h-[50vh] overflow-auto text-[11px] text-slate-300">
            {JSON.stringify(discussion, null, 2)}
          </pre>
        </div>
        <div className="rounded-lg border border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-cyan-200/90">Énergie marché</h2>
          <pre className="mt-2 max-h-[50vh] overflow-auto text-[11px] text-slate-300">
            {JSON.stringify(energy, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}
