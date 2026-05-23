import type {
  OrderLifecycleStatus,
  RelationalCommercialOrder,
  RelationalOrderActorRole,
  RelationalOrderOrchestrationFlags,
  RelationalOrderQuickActionId,
} from "./relational-order-orchestration.types";
import {
  buildOrderAccessContext,
  canCreateOrderWithAccess,
  canViewOrderWithAccess,
} from "./relational-order-access-bridge";

const STATUS_LABELS: Record<OrderLifecycleStatus, string> = {
  CREATED: "Commande envoyée",
  VALIDATED: "Validée par le partenaire",
  PREPARING: "En préparation",
  READY_FOR_LOADING: "Prête pour chargement",
  IN_TRANSIT: "Expédition en cours",
  DELIVERY_PENDING: "Livraison en cours",
  DELIVERED: "Livrée",
  RECEPTION_CONFIRMED: "Réception confirmée",
  SETTLEMENT_PENDING: "Règlement en attente",
  SETTLEMENT_CONFIRMED: "Règlement confirmé",
  CLOSED: "Activité clôturée",
  INCIDENT_REPORTED: "Incident signalé",
};

import { sanitizeCommerceFoundationText } from "commerce-foundation-guardrails";

export function isFormalActor(role: RelationalOrderActorRole): boolean {
  return role === "producteur" || role === "grossiste_a";
}

export function isTerrainActor(role: RelationalOrderActorRole): boolean {
  return role === "grossiste_b" || role === "detaillant";
}

export function isRelationalOrderOrchestrationEnabled(
  flags: RelationalOrderOrchestrationFlags = {},
): boolean {
  return flags.relational_order_orchestration_enabled !== false;
}

export function isCommercialDeliveryFlowEnabled(
  flags: RelationalOrderOrchestrationFlags = {},
): boolean {
  return (
    flags.commercial_delivery_flow_enabled !== false &&
    isRelationalOrderOrchestrationEnabled(flags)
  );
}

export function isCommercialSettlementFlowEnabled(
  flags: RelationalOrderOrchestrationFlags = {},
): boolean {
  return (
    flags.commercial_settlement_flow_enabled !== false &&
    isRelationalOrderOrchestrationEnabled(flags)
  );
}

export function humanStatusLabel(status: OrderLifecycleStatus): string {
  return STATUS_LABELS[status] ?? "Suivi commande";
}

export function sanitizeOrderUiText(text: string): string {
  return sanitizeCommerceFoundationText(text);
}

/** Accès lecture commande — pont commerce-access-control (20.83-A). */
export function canAccessRelationalOrder(
  role: RelationalOrderActorRole,
  order: RelationalCommercialOrder,
  flags: RelationalOrderOrchestrationFlags = {},
  organizationId?: string,
  relationshipId?: string,
): boolean {
  if (flags.commerce_access_control_enabled === false || !organizationId) {
    return true;
  }
  const ctx = buildOrderAccessContext({
    actorRole: role,
    organizationId,
    relationshipId,
    buyerOrganizationId: organizationId,
    sellerOrganizationId: order.partner.id,
    flags: { ...flags, commerce_access_control_enabled: true },
  });
  return canViewOrderWithAccess(ctx, () => true);
}

/** Création commande — pont commerce-access-control (20.83-A). */
export function canCreateRelationalOrder(
  role: RelationalOrderActorRole,
  organizationId: string,
  relationshipId: string | undefined,
  flags: RelationalOrderOrchestrationFlags = {},
): boolean {
  if (flags.commerce_access_control_enabled === false) return true;
  const ctx = buildOrderAccessContext({
    actorRole: role,
    organizationId,
    relationshipId,
    flags,
  });
  return canCreateOrderWithAccess(ctx);
}

export function canActorValidateOrder(
  role: RelationalOrderActorRole,
  order: RelationalCommercialOrder,
): boolean {
  if (order.status !== "CREATED") return false;
  if (role === "producteur") return true;
  if (role === "grossiste_a") return order.partner.partnerType.includes("producteur");
  return false;
}

export function canActorConfirmPreparation(role: RelationalOrderActorRole): boolean {
  return role === "producteur" || role === "grossiste_a";
}

export function canActorMarkShipped(role: RelationalOrderActorRole): boolean {
  return role === "producteur" || role === "grossiste_a";
}

export function canActorConfirmDelivery(role: RelationalOrderActorRole): boolean {
  return role === "grossiste_b" || role === "grossiste_a";
}

export function canActorConfirmReception(role: RelationalOrderActorRole): boolean {
  return role === "grossiste_a" || role === "grossiste_b" || role === "detaillant";
}

export function getAvailableQuickActions(
  role: RelationalOrderActorRole,
  order: RelationalCommercialOrder,
  flags: RelationalOrderOrchestrationFlags = {},
): RelationalOrderQuickActionId[] {
  const actions: RelationalOrderQuickActionId[] = [];

  if (canActorValidateOrder(role, order)) actions.push("validate-order");
  if (canActorConfirmPreparation(role) && order.status === "VALIDATED") {
    actions.push("confirm-preparation");
  }
  if (canActorMarkShipped(role) && ["PREPARING", "READY_FOR_LOADING"].includes(order.status)) {
    actions.push("mark-shipped");
  }
  if (
    isCommercialDeliveryFlowEnabled(flags) &&
    canActorConfirmDelivery(role) &&
    ["IN_TRANSIT", "DELIVERY_PENDING"].includes(order.status)
  ) {
    actions.push("confirm-delivery");
  }
  if (canActorConfirmReception(role) && ["DELIVERED", "DELIVERY_PENDING"].includes(order.status)) {
    actions.push("confirm-reception");
  }
  if (
    isCommercialSettlementFlowEnabled(flags) &&
    order.settlement &&
    order.status !== "CLOSED"
  ) {
    actions.push("view-settlement");
  }
  if (order.links.conversationId) actions.push("open-conversation");
  if (isFormalActor(role) && order.links.mailThreadId) actions.push("open-mail");
  if (order.links.activityId) actions.push("view-activity");

  return actions;
}

export function resolveActivePanel(
  order: RelationalCommercialOrder,
  role: RelationalOrderActorRole,
): string {
  if (order.incident) return "incident";
  if (order.sponsoredCorridor && order.links.activityId) return "activity";
  if (isTerrainActor(role)) {
    if (order.status === "DELIVERED") return "reception";
    if (order.status === "DELIVERY_PENDING") return "delivery";
    if (order.settlement) return "settlement";
    return "status";
  }
  if (order.status === "PREPARING" || order.status === "VALIDATED") return "preparation";
  if (["IN_TRANSIT", "READY_FOR_LOADING"].includes(order.status)) return "shipment";
  if (["DELIVERY_PENDING", "DELIVERED"].includes(order.status)) return "delivery";
  if (order.status === "RECEPTION_CONFIRMED") return "reception";
  if (order.settlement) return "settlement";
  if (order.links.activityId) return "activity";
  return "status";
}

export function nextStatusForAction(
  actionId: RelationalOrderQuickActionId,
  current: OrderLifecycleStatus,
): OrderLifecycleStatus | null {
  switch (actionId) {
    case "validate-order":
      return current === "CREATED" ? "VALIDATED" : null;
    case "confirm-preparation":
      return current === "VALIDATED" ? "PREPARING" : null;
    case "mark-shipped":
      return ["PREPARING", "READY_FOR_LOADING"].includes(current) ? "IN_TRANSIT" : null;
    case "confirm-delivery":
      return ["IN_TRANSIT", "DELIVERY_PENDING"].includes(current) ? "DELIVERED" : null;
    case "confirm-reception":
      return ["DELIVERED", "DELIVERY_PENDING"].includes(current)
        ? "RECEPTION_CONFIRMED"
        : null;
    default:
      return null;
  }
}

export function assertNoErpSupplyChainUi(testId: string | undefined): boolean {
  const forbidden = ["erp-supply", "supply-chain-ticket", "logistics-erp"];
  if (!testId) return true;
  return !forbidden.some((f) => testId.includes(f));
}
