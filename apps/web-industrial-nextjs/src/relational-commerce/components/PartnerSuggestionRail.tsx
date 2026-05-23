"use client";

import { useEffect, useState } from "react";

type SuggestionOrg = {
  id: string;
  displayName: string;
  commercialId: string;
  category: string;
  city?: string | null;
  credibilityScore?: unknown;
  commercialBadges?: string[];
};

type SuggestionRow = {
  id: string;
  score: number;
  reason: string;
  source: string;
  organization: SuggestionOrg;
};

type Payload = {
  userId: string;
  mutualContactClusters: {
    normalizedPhone: string;
    userCount: number;
    users: { id: string; fullName: string | null; phoneNumber: string | null }[];
  }[];
  graphSuggestions: SuggestionRow[];
};

type Props = { userId: string };

export function PartnerSuggestionRail({ userId }: Props) {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const r = await fetch(`/api/core/v1/relational-commerce/suggestions/users/${userId}`);
      if (!r.ok) return;
      const j = (await r.json()) as Payload;
      if (!cancelled) setData(j);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!data?.graphSuggestions.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 px-3 py-4 text-center text-xs text-slate-500">
        Aucune suggestion chargée (core ou drapeaux).
      </div>
    );
  }

  return (
    <div className="-mx-1">
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Suggestions graphe</p>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {data.graphSuggestions.map((s) => (
          <div
            key={s.id}
            className="min-w-[200px] shrink-0 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2"
          >
            <p className="text-sm font-medium text-white">{s.organization.displayName}</p>
            <p className="text-[10px] text-slate-500">
              {s.reason} · score {s.score}
            </p>
            <p className="mt-1 font-mono text-[10px] text-emerald-400/90">{s.organization.commercialId}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
