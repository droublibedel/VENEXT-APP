import type {
  CommercialDelivery,
  CommercialDeliveryActorRole,
  CommercialDeliveryFlowFlags,
  CommercialDeliveryQuickActionId,
  CommercialDeliveryStatus,
} from "./commercial-delivery-flow.types";

const STATUS_LABELS: Record<CommercialDeliveryStatus, string> = {
  DELIVERY_CREATED: "Livraison créée",
  PREPARING_LOADING: "Chargement en préparation",
  READY_FOR_DISPATCH: "Prête à partir",
  ON_THE_WAY: "Livraison en route",
  ARRIVING: "Arrivée proche",
  DELIVERED: "Livraison effectuée",
  RECEPTION_CONFIRMED: "Réception confirmée",
  DELIVERY_DELAYED: "Légèrement en retard",
  DELIVERY_INCIDENT: "Incident signalé",
  CLOSED: "Activité clôturée",
};

import { sanitizeDeliveryFoundationText } from "commerce-foundation-guardrails";

export function isFormalActor(role: CommercialDeliveryActorRole): boolean {
  return role === "producteur" || role === "grossiste_a";
}

export function isTerrainActor(role: CommercialDeliveryActorRole): boolean {
  return role === "grossiste_b" || role === "detaillant";
}

export function isCommercialDeliveryFlowEnabled(flags: CommercialDeliveryFlowFlags = {}): boolean {
  return flags.commercial_delivery_flow_enabled !== false;
}

export function isCommercialReceptionConfirmationEnabled(
  flags: CommercialDeliveryFlowFlags = {},
): boolean {
  return (
    flags.commercial_reception_confirmation_enabled !== false &&
    isCommercialDeliveryFlowEnabled(flags)
  );
}

export function isCommercialDeliveryActivityEnabled(
  flags: CommercialDeliveryFlowFlags = {},
): boolean {
  return (
    flags.commercial_delivery_activity_enabled !== false &&
    isCommercialDeliveryFlowEnabled(flags)
  );
}

export function humanDeliveryStatusLabel(status: CommercialDeliveryStatus): string {
  return STATUS_LABELS[status] ?? "Suivi livraison";
}

export function sanitizeDeliveryUiText(text: string): string {
  return sanitizeDeliveryFoundationText(text);
}

export function getAvailableDeliveryQuickActions(
  role: CommercialDeliveryActorRole,
  delivery: CommercialDelivery,
  flags: CommercialDeliveryFlowFlags = {},
): CommercialDeliveryQuickActionId[] {
  const actions: CommercialDeliveryQuickActionId[] = [];

  if (
    (role === "grossiste_b" || role === "producteur") &&
    ["READY_FOR_DISPATCH", "PREPARING_LOADING"].includes(delivery.status)
  ) {
    actions.push("confirm-departure");
  }
  if (role === "grossiste_b" && delivery.status === "ON_THE_WAY") {
    actions.push("mark-arriving");
  }
  if (
    (role === "grossiste_b" || role === "grossiste_a") &&
    ["ON_THE_WAY", "ARRIVING"].includes(delivery.status)
  ) {
    actions.push("confirm-delivery");
  }
  if (
    isCommercialReceptionConfirmationEnabled(flags) &&
    (role === "detaillant" || role === "grossiste_a" || role === "grossiste_b") &&
    ["DELIVERED", "ARRIVING"].includes(delivery.status)
  ) {
    actions.push("confirm-reception");
  }
  if (delivery.links.orderId) actions.push("view-linked-order");
  if (delivery.settlement?.statusLabel && delivery.links.walletTransactionId) {
    actions.push("view-settlement");
  }
  if (delivery.links.conversationId) actions.push("open-conversation");
  if (isFormalActor(role) && delivery.links.mailThreadId) actions.push("open-mail");
  if (isCommercialDeliveryActivityEnabled(flags) && delivery.links.activityId) {
    actions.push("view-terrain-activity");
  }

  return actions;
}

export function resolveActiveDeliveryPanel(
  delivery: CommercialDelivery,
  role: CommercialDeliveryActorRole,
): string {
  if (delivery.incident || delivery.status === "DELIVERY_INCIDENT") return "incident";
  if (delivery.sponsoredCorridor && delivery.links.activityId) return "activity";
  if (isTerrainActor(role)) {
    if (delivery.status === "DELIVERED") return "reception";
    if (["ARRIVING", "ON_THE_WAY"].includes(delivery.status)) return "confirmation";
    return "status";
  }
  if (["PREPARING_LOADING", "READY_FOR_DISPATCH"].includes(delivery.status)) return "confirmation";
  if (delivery.status === "RECEPTION_CONFIRMED") return "reception";
  if (delivery.links.activityId) return "activity";
  return "status";
}

export function nextStatusForDeliveryAction(
  actionId: CommercialDeliveryQuickActionId,
  current: CommercialDeliveryStatus,
): CommercialDeliveryStatus | null {
  switch (actionId) {
    case "confirm-departure":
      return ["PREPARING_LOADING", "READY_FOR_DISPATCH"].includes(current) ? "ON_THE_WAY" : null;
    case "mark-arriving":
      return current === "ON_THE_WAY" ? "ARRIVING" : null;
    case "confirm-delivery":
      return ["ON_THE_WAY", "ARRIVING"].includes(current) ? "DELIVERED" : null;
    case "confirm-reception":
      return ["DELIVERED", "ARRIVING"].includes(current) ? "RECEPTION_CONFIRMED" : null;
    default:
      return null;
  }
}

export function assertNoLogisticsErpUi(testId: string | undefined): boolean {
  const forbidden = ["tms-panel", "wms-tracking", "fleet-gps"];
  if (!testId) return true;
  return !forbidden.some((f) => testId.includes(f));
}
