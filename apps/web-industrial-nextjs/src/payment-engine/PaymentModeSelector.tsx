"use client";

import { useEffect, useState } from "react";

import {
  humanizeIndustrialCaught,
  readHumanizedHttpFailure,
} from "@/errors/industrial-humanized-feedback";

type Modes = { productId: string; name: string; paymentModes: string[]; sellerOrganizationId: string };

export function PaymentModeSelector({
  productId,
  organizationId,
}: {
  productId: string;
  organizationId?: string;
}) {
  const [data, setData] = useState<Modes | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const q = new URLSearchParams({ productId });
        if (organizationId) q.set("organizationId", organizationId);
        const r = await fetch(`/api/core/v1/payments/product-modes?${q.toString()}`);
        if (!r.ok) throw await readHumanizedHttpFailure(r);
        setData((await r.json()) as Modes);
      } catch (e) {
        setErr(humanizeIndustrialCaught(e, { fallbackKey: "wallet_action_failed" }));
      }
    })();
  }, [productId, organizationId]);

  if (err) return <p className="text-[11px] text-rose-300">{err}</p>;
  if (!data) return <p className="text-[11px] text-slate-500">Modes paiement produit…</p>;

  return (
    <div className="rounded border border-slate-800 bg-slate-950/60 p-2">
      <p className="text-[10px] font-medium text-slate-300">{data.name}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {data.paymentModes.map((m) => (
          <span
            key={m}
            className="rounded border border-amber-600/35 bg-amber-950/25 px-2 py-0.5 text-[10px] text-amber-50"
          >
            {m.replace(/_/g, " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
