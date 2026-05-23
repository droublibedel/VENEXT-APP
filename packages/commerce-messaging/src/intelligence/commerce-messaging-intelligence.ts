import type {
  CommerceConversation,
  CommerceMessage,
  CommerceOrderContext,
  CommerceProductContext,
} from "../hooks/commerce-messaging.types";
import type { CommerceLinkedContext } from "../linked-commerce/commerce-linked-context.types";
import type { ConversationMode } from "../governance/commerce-conversation-governance.types";
import { getGovernanceBadgeLabel } from "../governance/commerce-conversation-governance";

import { sanitizeCommerceFoundationText } from "commerce-foundation-guardrails";

export function sanitizeCommerceText(text: string): string {
  const out = sanitizeCommerceFoundationText(text);
  if (out === text.trim()) return text.trim();
  return out || "Signal utile pour faire avancer cette conversation.";
}

export type CommerceHint = { id: string; text: string };

export function buildConversationSignals(conversations: CommerceConversation[] | null): CommerceHint[] {
  if (!conversations?.length) return [];
  const active = conversations.filter((c) => c.needsReply);
  const hints: CommerceHint[] = [];
  if (active.length >= 2) {
    hints.push({
      id: "cs1",
      text: sanitizeCommerceText(`${active.length} conversations attendent une réponse.`),
    });
  }
  const corridor = conversations.find((c) => c.corridor);
  if (corridor) {
    hints.push({
      id: "cs2",
      text: sanitizeCommerceText(`Activité inhabituelle sur ${corridor.corridor}.`),
    });
  }
  return hints.slice(0, 3);
}

export function buildCommerceHints(messages: CommerceMessage[] | null): CommerceHint[] {
  if (!messages?.length) return [];
  const productMsgs = messages.filter((m) => m.kind === "product");
  if (productMsgs.length > 0) {
    return [
      {
        id: "ch1",
        text: sanitizeCommerceText("Produit très discuté aujourd'hui dans ce fil."),
      },
    ];
  }
  return [];
}

export function buildProductHints(ctx: CommerceProductContext | null): CommerceHint[] {
  if (!ctx) return [];
  const hints: CommerceHint[] = [];
  if (ctx.demand.toLowerCase().includes("forte")) {
    hints.push({
      id: "ph1",
      text: sanitizeCommerceText(`Demande en hausse sur ${ctx.name}.`),
    });
  }
  hints.push({
    id: "ph2",
    text: sanitizeCommerceText(`${ctx.name} — ${ctx.availability}`),
  });
  return hints.slice(0, 2);
}

export function buildOrderHints(ctx: CommerceOrderContext | null): CommerceHint[] {
  if (!ctx) return [];
  const hints: CommerceHint[] = [
    {
      id: "oh1",
      text: sanitizeCommerceText(`Commande ${ctx.status.toLowerCase()} — ${ctx.amountLabel}.`),
    },
  ];
  if (ctx.lateNote) {
    hints.push({ id: "oh2", text: sanitizeCommerceText(ctx.lateNote) });
  }
  return hints;
}

export const COMPOSER_QUICK_SUGGESTIONS = [
  "Produit disponible",
  "Commande prête",
  "Livraison en cours",
  "Stock limité",
] as const;

export function buildConversationModeHints(
  mode: ConversationMode | undefined,
  opts?: { corridor?: string; partnersOnly?: boolean },
): CommerceHint[] {
  if (!mode || mode === "NEGOTIABLE") {
    const hints: CommerceHint[] = [];
    if (opts?.corridor) {
      hints.push({
        id: "cmh-corridor",
        text: sanitizeCommerceText(`Négociation active sur ${opts.corridor}.`),
      });
    }
    return hints.slice(0, 1);
  }
  if (mode === "FIXED_PRICE_ONLY") {
    return [{ id: "cmh-fixed", text: sanitizeCommerceText("Produit en prix fixe.") }];
  }
  if (mode === "PARTNER_ONLY") {
    return [
      {
        id: "cmh-partner",
        text: sanitizeCommerceText("Discussion réservée réseau partenaire."),
      },
    ];
  }
  if (mode === "DISABLED") {
    return [
      {
        id: "cmh-off",
        text: sanitizeCommerceText("Discussion désactivée pour ce fil."),
      },
    ];
  }
  if (mode === "ORDER_CONTEXT_ONLY") {
    return [
      {
        id: "cmh-order",
        text: sanitizeCommerceText("Échanges limités au contexte commande."),
      },
    ];
  }
  return [{ id: "cmh-mode", text: sanitizeCommerceText(getGovernanceBadgeLabel(mode)) }];
}

export function buildNegotiationSignals(
  mode: ConversationMode | undefined,
  productCtx: CommerceProductContext | null,
): CommerceHint[] {
  if (mode !== "NEGOTIABLE" && mode !== "PARTNER_ONLY") return [];
  const hints: CommerceHint[] = [];
  if (productCtx?.demand.toLowerCase().includes("forte")) {
    hints.push({
      id: "ns-demand",
      text: sanitizeCommerceText(`Marge de discussion sur ${productCtx.name}.`),
    });
  }
  return hints.slice(0, 1);
}

export function buildLinkedCommerceSignals(
  linked: CommerceLinkedContext | null,
): CommerceHint[] {
  if (!linked) return [];
  const hints: CommerceHint[] = [];
  if (linked.order) {
    hints.push({
      id: "lcs-order",
      text: sanitizeCommerceText("Commande liée confirmée."),
    });
  }
  if (linked.settlement?.partnerConfirmed) {
    hints.push({
      id: "lcs-settlement",
      text: sanitizeCommerceText("Règlement partenaire reçu."),
    });
  }
  return hints.slice(0, 2);
}

export function buildSettlementConversationHints(
  linked: CommerceLinkedContext | null,
): CommerceHint[] {
  if (!linked?.settlement) return [];
  const hints: CommerceHint[] = [];
  const pending = linked.settlement.statusLabel.toLowerCase().includes("attente");
  if (pending) {
    hints.push({
      id: "sch-pending",
      text: sanitizeCommerceText("Confirmation en attente."),
    });
  }
  if (linked.order?.delivery) {
    hints.push({
      id: "sch-delivery",
      text: sanitizeCommerceText("Livraison associée à cette conversation."),
    });
  }
  return hints.slice(0, 2);
}

export function buildCommercialFlowHints(
  linked: CommerceLinkedContext | null,
): CommerceHint[] {
  if (!linked) return [];
  const hints: CommerceHint[] = [
    {
      id: "cfh-active",
      text: sanitizeCommerceText("Activité commerciale toujours active."),
    },
  ];
  if (linked.productName) {
    hints.push({
      id: "cfh-product",
      text: sanitizeCommerceText(`${linked.productName} — fil commercial lié.`),
    });
  }
  return hints.slice(0, 2);
}
