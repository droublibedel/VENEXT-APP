"use client";

import { useCallback, useState } from "react";

import { humanizeIndustrialCaught, readHumanizedHttpFailure } from "@/errors/industrial-humanized-feedback";

import { DEMO_ACTOR, venextActorHeaders } from "../constants";
import { enqueueOutbound } from "../offline/outbound-queue";

type Props = {
  threadId: string;
  negotiationId: string | null;
  onAfterAction: () => Promise<void>;
};

/**
 * Operational quick actions — not emoji stickers (Instruction 7 §7).
 */
export function CommerceActionRail({ threadId, negotiationId, onAfterAction }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const run = useCallback(
    async (key: string, fn: () => Promise<void>) => {
      setBusy(key);
      setNote(null);
      try {
        await fn();
        await onAfterAction();
      } catch (e) {
        setNote(
          humanizeIndustrialCaught(e, {
            fallbackKey: "message_not_sent",
          }),
        );
      } finally {
        setBusy(null);
      }
    },
    [onAfterAction],
  );

  const neg = (path: string, body: object) =>
    fetch(`/api/core/v1/negotiation-engine/${negotiationId}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...venextActorHeaders(DEMO_ACTOR) },
      body: JSON.stringify(body),
    });

  const postMessage = (body: object) =>
    fetch(`/api/core/v1/commerce-messaging/threads/${threadId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...venextActorHeaders(DEMO_ACTOR) },
      body: JSON.stringify(body),
    });

  const actions = (
    <>
      <ActionBtn
        label="Proposer prix"
        disabled={!negotiationId || busy !== null}
        onClick={() => {
          const v = window.prompt("Prix unitaire (XOF)", "405000");
          if (v == null || !negotiationId) return;
          const unitPrice = Number(v);
          if (!Number.isFinite(unitPrice)) return;
          void run("price", async () => {
            const r = await neg("/propose-price", { unitPrice });
            if (!r.ok) throw await readHumanizedHttpFailure(r);
          });
        }}
      />
      <ActionBtn
        label="Modifier quantité"
        disabled={!negotiationId || busy !== null}
        onClick={() => {
          const v = window.prompt("Quantité palette / unités", "16");
          if (v == null || !negotiationId) return;
          const quantity = Number(v);
          if (!Number.isFinite(quantity)) return;
          void run("qty", async () => {
            const r = await neg("/propose-quantity", { quantity });
            if (!r.ok) throw await readHumanizedHttpFailure(r);
          });
        }}
      />
      <ActionBtn
        label="Réserver stock"
        disabled={!negotiationId || busy !== null}
        onClick={() => {
          const n = window.prompt("Note réservation", "Blocage 24h demandé");
          if (!negotiationId) return;
          void run("res", async () => {
            const r = await neg("/reservation-intent", { note: n ?? undefined });
            if (!r.ok) throw await readHumanizedHttpFailure(r);
          });
        }}
      />
      <ActionBtn
        label="Demander livraison"
        disabled={busy !== null}
        onClick={() =>
          void run("del", async () => {
            const r = await postMessage({
              messageType: "DELIVERY_PROPOSAL",
              content: "Demande créneau livraison opérationnel (UI).",
              structuredEvent: { kind: "delivery_request", channel: "ops_ui" },
            });
            if (!r.ok) throw await readHumanizedHttpFailure(r);
          })
        }
      />
      <ActionBtn
        label="Mode paiement"
        disabled={busy !== null}
        onClick={() =>
          void run("pay", async () => {
            const r = await postMessage({
              messageType: "PAYMENT_PROPOSAL",
              content: "Demande clarification mode paiement.",
              structuredEvent: { kind: "payment_mode_request" },
            });
            if (!r.ok) throw await readHumanizedHttpFailure(r);
          })
        }
      />
      <ActionBtn
        label="Facture"
        disabled={busy !== null}
        onClick={() =>
          void run("inv", async () => {
            const r = await postMessage({
              messageType: "SYSTEM_EVENT",
              content: "Demande facture proforma / TVA.",
              structuredEvent: { kind: "invoice_request" },
            });
            if (!r.ok) throw await readHumanizedHttpFailure(r);
          })
        }
      />
      <ActionBtn
        label="Acceptation partielle"
        disabled={!negotiationId || busy !== null}
        onClick={() => {
          const q = window.prompt("Quantité acceptée (vide = proposition courante)", "");
          const p = window.prompt("Prix unitaire accepté (vide = proposition courante)", "");
          if (!negotiationId) return;
          const partial: { quantity?: number; unitPrice?: number } = {};
          if (q && q.trim()) partial.quantity = Number(q);
          if (p && p.trim()) partial.unitPrice = Number(p);
          void run("part", async () => {
            const r = await neg("/accept", { partial });
            if (!r.ok) throw await readHumanizedHttpFailure(r);
          });
        }}
      />
      <ActionBtn
        label="Accepter proposition"
        disabled={!negotiationId || busy !== null}
        onClick={() =>
          void run("acc", async () => {
            const r = await neg("/accept", {});
            if (!r.ok) throw await readHumanizedHttpFailure(r);
          })
        }
      />
      <ActionBtn
        label="Refuser"
        disabled={!negotiationId || busy !== null}
        onClick={() => {
          const reason = window.prompt("Motif refus", "Conditions non alignées");
          if (!negotiationId) return;
          void run("rej", async () => {
            const r = await neg("/reject", { reason: reason ?? undefined });
            if (!r.ok) throw await readHumanizedHttpFailure(r);
          });
        }}
      />
      <ActionBtn
        label="→ Panier"
        disabled={!negotiationId || busy !== null}
        onClick={() =>
          void run("cart", async () => {
            const r = await neg("/convert-to-cart", {});
            if (!r.ok) throw await readHumanizedHttpFailure(r);
          })
        }
      />
      <ActionBtn
        label="File hors-ligne"
        disabled={busy !== null}
        onClick={() => {
          enqueueOutbound(threadId, {
            op: "send_text",
            draft: "Message mis en file — réseau instable.",
          });
          void onAfterAction();
        }}
      />
    </>
  );

  return (
    <div className="flex flex-col gap-2 border-t border-slate-800/90 bg-slate-950/95 p-2 md:w-56 md:border-l md:border-t-0 md:py-3">
      <p className="px-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-500">
        Actions opérationnelles
      </p>
      <div className="flex flex-row flex-wrap gap-1.5 md:flex-col md:flex-nowrap">{actions}</div>
      {note ? <p className="px-1 text-[10px] text-rose-300/90">{note}</p> : null}
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded border border-slate-700/90 bg-slate-900/80 px-2 py-1.5 text-left text-[11px] text-slate-100 hover:border-cyan-600/45 hover:bg-slate-900 disabled:opacity-40"
    >
      {label}
    </button>
  );
}
