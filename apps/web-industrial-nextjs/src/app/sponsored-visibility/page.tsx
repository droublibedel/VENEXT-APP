"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  humanizeIndustrialCaught,
  humanizedHttpFailure,
} from "@/errors/industrial-humanized-feedback";

export default function SponsoredVisibilityPage() {
  const [rows, setRows] = useState<unknown[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/core/v1/sponsored-visibility/injections")
      .then(async (r) => {
        if (!r.ok) throw new Error(humanizedHttpFailure(r.status));
        return r.json();
      })
      .then(setRows)
      .catch((e: unknown) => setErr(humanizeIndustrialCaught(e, { fallbackKey: "catalog_unavailable" })));
  }, []);

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <Link href="/product-intelligence" className="text-xs text-cyan-400 hover:underline">
        ← Catalogue vivant
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Injections de visibilité</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Règles graphe + catégorie — pas de publicité marketplace ouverte.
      </p>
      {err ? <p className="mt-4 text-rose-300">{err}</p> : null}
      <ul className="mt-6 space-y-3 text-sm">
        {(Array.isArray(rows) ? rows : []).map((raw) => {
          const r = raw as {
            id: string;
            targetCommercialCategory: string;
            product: { name: string };
            sponsor: { displayName: string };
          };
          return (
            <li key={r.id} className="rounded-lg border border-violet-900/50 bg-violet-950/20 px-3 py-2">
              <span className="text-violet-100">{r.product?.name}</span> via {r.sponsor?.displayName} · cible{" "}
              <span className="font-mono text-violet-200/80">{r.targetCommercialCategory}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
