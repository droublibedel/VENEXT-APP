import {
  enrichLinkedCommerceContext,
  isRelationshipContextEnabled,
  mapSupplierTypeToActorRole,
  type CommercialActorRole,
  type CommercialRelationshipGovernanceFlags,
} from "commercial-relationship-governance";

import type {
  CommercePartnerPayment,
  CommercePaymentActivity,
  CommerceTransaction,
  CommerceWalletBalance,
} from "../hooks/commerce-wallet.types";
import { SETTLEMENT_STATUS_DISPLAY } from "../settlements/commerce-settlement.types";

export type WalletHint = { id: string; text: string };

import { sanitizeWalletFoundationText } from "commerce-foundation-guardrails";

export function sanitizeWalletText(text: string): string {
  return sanitizeWalletFoundationText(text);
}

export function buildWalletSignals(balance: CommerceWalletBalance | null): WalletHint[] {
  if (!balance) return [];
  const hints: WalletHint[] = [];
  if (balance.activityLevel === "stable") {
    hints.push({
      id: "cws-stable",
      text: sanitizeWalletText("Activité commerciale stable."),
    });
  }
  if (balance.stabilityNote) {
    hints.push({ id: "cws-note", text: sanitizeWalletText(balance.stabilityNote) });
  }
  return hints.slice(0, 2);
}

export function buildPaymentHints(transactions: CommerceTransaction[]): WalletHint[] {
  const hints: WalletHint[] = [];
  const pending = transactions.find((t) => t.status === "pending");
  if (pending) {
    hints.push({
      id: `cph-${pending.id}`,
      text: sanitizeWalletText(`Confirmation en attente — ${pending.partnerName ?? pending.label}.`),
    });
  }
  const confirmed = transactions.find((t) => t.status === "confirmed");
  if (confirmed) {
    hints.push({
      id: `cph-ok-${confirmed.id}`,
      text: sanitizeWalletText("Paiement partenaire reçu."),
    });
  }
  return hints.slice(0, 2);
}

export function buildSettlementSignals(
  activity: CommercePaymentActivity[],
): WalletHint[] {
  return activity.slice(0, 2).map((a) => ({
    id: a.id,
    text: sanitizeWalletText(a.text),
  }));
}

export function buildSettlementActivitySignals(
  transactions: CommerceTransaction[],
): WalletHint[] {
  const hints: WalletHint[] = [];
  const settled = transactions.filter((t) => t.status === "settled");
  if (settled.length) {
    hints.push({
      id: "csas-settled",
      text: sanitizeWalletText("Règlement confirmé aujourd'hui."),
    });
  }
  const cash = transactions.find((t) => t.settlementMethod === "cash" && t.status === "settled");
  if (cash) {
    hints.push({
      id: `csas-${cash.id}`,
      text: sanitizeWalletText(`Réglé en cash — ${cash.city}.`),
    });
  }
  return hints.slice(0, 2);
}

export function buildSettlementStabilityHints(
  balance: CommerceWalletBalance | null,
  activity: CommercePaymentActivity[],
): WalletHint[] {
  const hints: WalletHint[] = [];
  if (balance?.activityLevel === "stable") {
    hints.push({
      id: "cssh-stable",
      text: sanitizeWalletText("Activité commerciale stable sur le réseau."),
    });
  }
  const regular = activity.find((a) => a.text.toLowerCase().includes("régulier"));
  if (regular) {
    hints.push({ id: regular.id, text: sanitizeWalletText(regular.text) });
  }
  return hints.slice(0, 2);
}

export function buildRelationshipSettlementHints(
  actorRole: CommercialActorRole,
  partnerType: string,
  flags: CommercialRelationshipGovernanceFlags = {},
): WalletHint[] {
  if (!isRelationshipContextEnabled(flags)) return [];
  const partnerRole = mapSupplierTypeToActorRole(partnerType);
  const linked = enrichLinkedCommerceContext({ self: actorRole, partner: partnerRole }, { flags });
  const hints: WalletHint[] = [
    {
      id: "crs-linked",
      text: sanitizeWalletText(linked.linkedLabel),
    },
  ];
  if (linked.preferMessaging) {
    hints.push({
      id: "crs-messaging",
      text: sanitizeWalletText("Règlement contextualisé — échange terrain sur cette relation"),
    });
  } else if (linked.preferMail) {
    hints.push({
      id: "crs-mail",
      text: sanitizeWalletText("Règlement contextualisé — suivi formel sur cette relation"),
    });
  }
  return hints.slice(0, 2);
}

export function buildSettlementPartnerSignals(
  partners: CommercePartnerPayment[],
  transactions: CommerceTransaction[],
): WalletHint[] {
  const hints: WalletHint[] = [];
  const pendingPartner = partners.find((p) => p.status === "pending");
  if (pendingPartner) {
    hints.push({
      id: `csps-${pendingPartner.id}`,
      text: sanitizeWalletText(`Confirmation partenaire — ${pendingPartner.partnerName}.`),
    });
  }
  const mobile = transactions.find((t) => t.settlementMethod === "mobile-money");
  if (mobile) {
    hints.push({
      id: `csps-mm-${mobile.id}`,
      text: sanitizeWalletText(
        SETTLEMENT_STATUS_DISPLAY["mobile-money"],
      ),
    });
  }
  return hints.slice(0, 2);
}
