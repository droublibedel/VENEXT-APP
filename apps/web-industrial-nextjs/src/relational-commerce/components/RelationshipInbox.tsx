"use client";

import { useCallback, useEffect, useState } from "react";

import { GraphRelationshipBadge } from "./GraphRelationshipBadge";
import { RelationshipActionPanel } from "./RelationshipActionPanel";

type OrgMini = { id: string; displayName: string; commercialId: string };

type PendingRel = {
  id: string;
  status: string;
  source: string;
  trustLevel?: number | null;
  upstreamOrganizationId: string;
  downstreamOrganizationId: string;
  requester: OrgMini;
  receiver: OrgMini;
  upstreamOrg: OrgMini;
  downstreamOrg: OrgMini;
};

type Props = { organizationId: string };

export function RelationshipInbox({ organizationId }: Props) {
  const [rows, setRows] = useState<PendingRel[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const r = await fetch(`/api/core/v1/relationships/received/${organizationId}`);
      if (!r.ok) return;
      const j = (await r.json()) as PendingRel[];
      if (!cancelled) setRows(j);
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId, reloadKey]);

  if (!rows.length) {
    return <p className="text-xs text-slate-500">Aucune invitation en attente pour cette organisation.</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((rel) => {
        const other = rel.requester;
        return (
          <li key={rel.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-white">{other.displayName}</p>
                <p className="text-[10px] text-slate-500">
                  {rel.source} · {rel.status}
                </p>
              </div>
              <GraphRelationshipBadge trustLevel={rel.trustLevel} status={rel.status} compact />
            </div>
            <p className="mt-2 font-mono text-[10px] text-slate-500">{other.commercialId}</p>
            <div className="mt-3">
              <RelationshipActionPanel
                relationshipId={rel.id}
                actingOrganizationId={organizationId}
                upstreamOrganizationId={rel.upstreamOrganizationId}
                downstreamOrganizationId={rel.downstreamOrganizationId}
                onAfterAction={reload}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
