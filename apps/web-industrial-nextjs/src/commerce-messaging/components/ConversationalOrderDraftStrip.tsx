"use client";

import type { ConversationalOrderDraftResponse } from "@venext/shared-contracts";

import { readHumanizedHttpFailure } from "@/errors/industrial-humanized-feedback";

import { DEMO_ACTOR, venextActorHeaders } from "../constants";
import { SwipeToConfirmStrip } from "./SwipeToConfirmStrip";

type Props = {
  threadId: string;
  snapshot: ConversationalOrderDraftResponse | null;
  loading: boolean;
  error: string | null;
  onReload: () => void | Promise<void>;
};

function DraftDiagnostics({ snap }: { snap: ConversationalOrderDraftResponse }) {
  const x = snap.diagnostics;
  return (
    <p className="mt-1 text-[8px] leading-snug text-slate-500">
      Auth {x.actorResolvedFrom} · corps acteur non fiable ({String(x.bodyActorTrusted)}) · fil{" "}
      {x.threadMembershipValidated ? "ok" : "bloqué"} · relation {x.relationshipValidated ? "ok" : "non résolue"} ·
      corridor {x.corridorValidated ? "ok" : "non validé"} · négociation {x.negotiationStatusMutation}
      {x.hardAcceptedStatusWritten ? " · statut dur écrit" : ""}
    </p>
  );
}

export function ConversationalOrderDraftStrip(props: Props) {
  const { threadId, snapshot, loading, error, onReload } = props;
  if (loading && !snapshot) {
    return <p className="text-[9px] text-slate-500">Brouillon conversationnel…</p>;
  }
  if (error) {
    return <p className="text-[9px] text-amber-200/90">Brouillon : {error}</p>;
  }
  if (!snapshot) {
    return null;
  }
  if (snapshot.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-800/80 bg-slate-950/40 px-2 py-2 text-[9px] text-slate-400">
        <p>Moteur 20.1 désactivé pour cette organisation — chat naturel inchangé.</p>
        <DraftDiagnostics snap={snapshot} />
      </div>
    );
  }
  const d = snapshot.draft;
  const partner =
    snapshot.productId != null
      ? `produit ${snapshot.productId.slice(0, 8)}…`
      : "contexte produit non lié";

  const authHeaders = () => ({
    ...venextActorHeaders(DEMO_ACTOR),
    "Content-Type": "application/json",
  });

  const confirm = async () => {
    const r = await fetch(
      `/api/core/v1/commerce-messaging/threads/${threadId}/conversational-order-draft/confirm-human`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({}),
      },
    );
    if (!r.ok) throw await readHumanizedHttpFailure(r);
    await onReload();
  };

  const reject = async () => {
    if (
      !window.confirm(
        "Rejeter le brouillon structuré ? Les messages du fil restent ; seules les ancres de proposition conversationnelle sont réinitialisées.",
      )
    ) {
      return;
    }
    const r = await fetch(
      `/api/core/v1/commerce-messaging/threads/${threadId}/conversational-order-draft/reject-human`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({}),
      },
    );
    if (!r.ok) throw await readHumanizedHttpFailure(r);
    await onReload();
  };

  return (
    <section
      className="rounded border border-emerald-900/40 bg-emerald-950/15 px-2 py-2 text-[10px] text-emerald-50/95"
      data-testid="conversational-order-draft-strip"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Brouillon relationnel</p>
        <span className="font-mono text-[9px] text-emerald-300/80">{d.negotiationState}</span>
      </div>
      <DraftDiagnostics snap={snapshot} />
      <p className="mt-1 text-[9px] text-emerald-100/80">
        {partner} · confiance extraction{" "}
        <span className="font-mono">{(d.extractionConfidence * 100).toFixed(0)}%</span> · risque interprétation implicite{" "}
        <span className="font-mono">{(d.implicitInterpretationRisk * 100).toFixed(0)}%</span>
      </p>
      <ul className="mt-1 grid gap-0.5 font-mono text-[9px] text-slate-300 md:grid-cols-2">
        <li>qty={d.workingTerms.quantity ?? "—"}</li>
        <li>prix={d.workingTerms.unitPrice ?? "—"}</li>
        <li>unité={d.workingTerms.quantityUnit ?? "—"}</li>
        <li>devise={d.workingTerms.currency ?? "—"}</li>
        <li className="md:col-span-2">délai={d.workingTerms.deliveryHint ?? "—"}</li>
      </ul>
      <p className="mt-1 text-[9px] text-slate-400">{d.advisoryNote}</p>
      {d.unresolvedFields.length ? (
        <p className="mt-1 text-[9px] text-amber-200/80">Champs ouverts : {d.unresolvedFields.join(", ")}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {d.negotiationState === "DRAFT_READY" || d.negotiationState === "IMPLICIT_ACCEPTANCE" ? (
          <SwipeToConfirmStrip onConfirm={confirm} />
        ) : null}
        <button
          type="button"
          className="rounded border border-rose-900/50 bg-rose-950/30 px-2 py-1 text-[9px] text-rose-100 hover:bg-rose-950/50"
          onClick={() => void reject()}
        >
          Rejeter le brouillon
        </button>
      </div>
    </section>
  );
}
