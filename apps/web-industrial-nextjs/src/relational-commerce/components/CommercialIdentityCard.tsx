"use client";

import { useEffect, useState } from "react";

import { humanizeIndustrialCaught, readHumanizedHttpFailure } from "@/errors/industrial-humanized-feedback";

import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";
import { CommercialCodeCard } from "./CommercialCodeCard";

type Identity = {
  organizationId: string;
  commercialNetworkId: string;
  displayName: string;
  activityLabel: string;
  contextualRole: string;
  category: string;
  city?: string | null;
  country?: string | null;
  credibilityScore?: unknown;
  commercialBadges: string[];
  partnerCount: number;
  pendingInvitations: number;
  dualMarketplaceNote?: string | null;
};

type Props = { organizationId: string };

export function CommercialIdentityCard({ organizationId }: Props) {
  const [data, setData] = useState<Identity | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch(`/api/core/v1/relational-commerce/identity/${organizationId}`);
        if (!r.ok) throw await readHumanizedHttpFailure(r);
        const j = (await r.json()) as Identity;
        if (!cancelled) setData(j);
      } catch (e) {
        if (!cancelled) setErr(humanizeIndustrialCaught(e, { fallbackKey: "catalog_unavailable" }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  if (err) {
    return <p className="text-xs text-rose-300">Identité: {err} (vérifiez le proxy core + feature flag)</p>;
  }
  if (!data) {
    return <VenextInlineSkeleton variant="table" className="p-2" />;
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Identité commerciale</p>
          <h3 className="text-base font-semibold text-white">{data.displayName}</h3>
          <p className="text-xs text-slate-400">{data.activityLabel}</p>
        </div>
        <span className="rounded border border-slate-600 px-2 py-0.5 text-[10px] text-slate-300">{data.contextualRole}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {data.commercialBadges.map((b) => (
          <span key={b} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-amber-100/90">
            {b}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
        <span>Partenaires actifs: {data.partnerCount}</span>
        <span>Invitations: {data.pendingInvitations}</span>
        {data.city ? (
          <span className="col-span-2">
            {data.city}
            {data.country ? `, ${data.country}` : ""}
          </span>
        ) : null}
      </div>
      <CommercialCodeCard commercialNetworkId={data.commercialNetworkId} organizationName={data.displayName} />
      {data.dualMarketplaceNote ? <p className="text-[10px] leading-snug text-slate-500">{data.dualMarketplaceNote}</p> : null}
    </div>
  );
}
