"use client";

import { useCallback, useState } from "react";

import {
  humanizeIndustrialCaught,
  readHumanizedHttpFailure,
} from "@/errors/industrial-humanized-feedback";

type Props = {
  relationshipId: string;
  actingOrganizationId: string;
  upstreamOrganizationId: string;
  downstreamOrganizationId: string;
  onAfterAction?: () => void;
};

export function RelationshipActionPanel({
  relationshipId,
  actingOrganizationId,
  upstreamOrganizationId,
  downstreamOrganizationId,
  onAfterAction,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const run = useCallback(
    async (path: "accept" | "reject" | "block") => {
      setBusy(path);
      setMsg(null);
      try {
        const q = new URLSearchParams({ actingOrganizationId });
        const init: RequestInit =
          path === "accept"
            ? {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ upstreamOrganizationId, downstreamOrganizationId }),
              }
            : { method: "PATCH" };
        const r = await fetch(`/api/core/v1/relationships/${relationshipId}/${path}?${q}`, init);
        if (!r.ok) throw await readHumanizedHttpFailure(r);
        setMsg(path === "accept" ? "Relation activée." : path === "reject" ? "Invitation refusée." : "Relation bloquée.");
        onAfterAction?.();
      } catch (e) {
        setMsg(humanizeIndustrialCaught(e, { fallbackKey: "access_denied" }));
      } finally {
        setBusy(null);
      }
    },
    [actingOrganizationId, downstreamOrganizationId, onAfterAction, relationshipId, upstreamOrganizationId],
  );

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={!!busy}
        onClick={() => void run("accept")}
        className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
      >
        {busy === "accept" ? "…" : "Accepter"}
      </button>
      <button
        type="button"
        disabled={!!busy}
        onClick={() => void run("reject")}
        className="rounded-full border border-slate-600 px-3 py-1.5 text-xs text-slate-200 disabled:opacity-40"
      >
        {busy === "reject" ? "…" : "Refuser"}
      </button>
      <button
        type="button"
        disabled={!!busy}
        onClick={() => void run("block")}
        className="rounded-full border border-rose-900/60 bg-rose-950/40 px-3 py-1.5 text-xs text-rose-100 disabled:opacity-40"
      >
        {busy === "block" ? "…" : "Bloquer"}
      </button>
      {msg ? <p className="w-full text-[11px] text-slate-400">{msg}</p> : null}
    </div>
  );
}
