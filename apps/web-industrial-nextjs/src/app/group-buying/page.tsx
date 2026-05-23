"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  humanizeIndustrialCaught,
  humanizedHttpFailure,
} from "@/errors/industrial-humanized-feedback";

export default function GroupBuyingPage() {
  const [rows, setRows] = useState<unknown[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/core/v1/group-buying/sessions")
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
      <h1 className="mt-4 text-2xl font-semibold">Sessions de co-achat</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Visibles uniquement dans les réseaux compatibles — pas d’exposition publique.
      </p>
      {err ? <p className="mt-4 text-rose-300">{err}</p> : null}
      <ul className="mt-6 space-y-3">
        {(Array.isArray(rows) ? rows : []).map((s) => {
          const row = s as {
            id: string;
            status: string;
            product: { name: string };
            currentQuantity: unknown;
          };
          return (
            <li
              key={row.id}
              className="rounded-lg border border-slate-800 bg-black/40 px-3 py-2 text-sm text-slate-200"
            >
              <span className="font-medium">{row.product?.name}</span> · {row.status} · courant{" "}
              {String(row.currentQuantity)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
