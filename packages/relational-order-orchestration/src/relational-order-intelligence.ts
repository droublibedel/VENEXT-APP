import {
  buildLinkedCommerceRelationshipLabel,
  buildRelationshipContext,
  isRelationshipContextEnabled,
  mapSupplierTypeToActorRole,
} from "commercial-relationship-governance";

import { humanStatusLabel } from "./relational-order-governance";
import type {
  OrderLifecycleStatus,
  RelationalCommercialOrder,
  RelationalOrderActorRole,
  RelationalOrderOrchestrationFlags,
  RelationalOrderSettlement,
} from "./relational-order-orchestration.types";

import { sanitizeCommerceFoundationText } from "commerce-foundation-guardrails";

export function sanitizeRelationalOrderText(text: string): string {
  return sanitizeCommerceFoundationText(text);
}

export function buildOrderFlowSignals(order: RelationalCommercialOrder | null): string[] {
  if (!order) return [];
  const signals: string[] = [];
  const label = humanStatusLabel(order.status);

  if (order.status === "PREPARING") signals.push("Commande en préparation");
  else if (order.status === "IN_TRANSIT" || order.status === "DELIVERY_PENDING") {
    signals.push("Livraison en cours");
  } else if (order.status === "RECEPTION_CONFIRMED") {
    signals.push("Réception partenaire confirmée");
  } else if (label) signals.push(label);

  if (order.settlement && order.settlement.optional !== true) {
    signals.push("Règlement associé disponible");
  }
  if (order.status !== "CLOSED" && order.links.activityId) {
    signals.push("Activité commerciale toujours active");
  }
  if (order.sponsoredCorridor) {
    signals.push("Commande liée à votre corridor réseau");
  }

  return signals.map(sanitizeRelationalOrderText).slice(0, 4);
}

export function buildCommercialProgressHints(
  status: OrderLifecycleStatus,
): string[] {
  const hints: string[] = [];
  if (["CREATED", "VALIDATED"].includes(status)) {
    hints.push("En attente de validation partenaire");
  }
  if (["PREPARING", "READY_FOR_LOADING"].includes(status)) {
    hints.push("Les produits sont préparés pour votre partenaire");
  }
  if (["IN_TRANSIT", "DELIVERY_PENDING", "DELIVERED"].includes(status)) {
    hints.push("La livraison suit le rythme de votre relation");
  }
  if (status === "CLOSED") {
    hints.push("Cette commande reste visible dans votre historique commercial");
  }
  return hints.map(sanitizeRelationalOrderText);
}

export function buildSettlementProgressHints(
  settlement: RelationalOrderSettlement | null | undefined,
): string[] {
  if (!settlement) return ["Règlement optionnel — pas obligatoire pour avancer"];
  const hints: string[] = [];
  if (settlement.optional) {
    hints.push("Règlement optionnel pour cette commande");
  }
  if (settlement.statusLabel.toLowerCase().includes("attente")) {
    hints.push("Règlement en attente de confirmation terrain");
  } else if (
    settlement.statusLabel.toLowerCase().includes("confirmé") ||
    settlement.statusLabel.toLowerCase().includes("réglé")
  ) {
    hints.push("Règlement confirmé avec le partenaire");
  } else {
    hints.push(settlement.statusLabel);
  }
  return hints.map(sanitizeRelationalOrderText);
}

export function buildDeliverySignals(order: RelationalCommercialOrder | null): string[] {
  if (!order) return [];
  const signals: string[] = [];
  if (order.incident?.kind === "delivery-delay") {
    signals.push("Légère attente sur la livraison — votre partenaire est informé");
  }
  if (["IN_TRANSIT", "DELIVERY_PENDING"].includes(order.status)) {
    signals.push(`Livraison vers ${order.city}`);
  }
  if (order.status === "DELIVERED") {
    signals.push("Livraison effectuée — confirmez la réception si besoin");
  }
  return signals.map(sanitizeRelationalOrderText);
}

export function buildRelationshipOrderHints(
  actorRole: RelationalOrderActorRole,
  order: RelationalCommercialOrder | null,
  flags: RelationalOrderOrchestrationFlags = {},
): string[] {
  if (!order || !isRelationshipContextEnabled(flags)) return [];
  const partnerRole = mapSupplierTypeToActorRole(order.partner.partnerType);
  const ctx = buildRelationshipContext({ self: actorRole, partner: partnerRole }, { flags });
  const hints = [buildLinkedCommerceRelationshipLabel(ctx)];
  if (ctx.governance.preferMail && order.links.mailThreadId) {
    hints.push("Commande liée — échange mail sur cette relation");
  } else if (ctx.governance.preferMessaging && order.links.conversationId) {
    hints.push("Commande liée — conversation commerce sur cette relation");
  }
  return hints.map(sanitizeRelationalOrderText).slice(0, 3);
}
