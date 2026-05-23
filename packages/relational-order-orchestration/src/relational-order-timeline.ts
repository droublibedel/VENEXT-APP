import { isCommercialDeliveryFlowEnabled, isCommercialSettlementFlowEnabled } from "./relational-order-governance";
import type {
  OrderTimelineStep,
  RelationalCommercialOrder,
  RelationalOrderOrchestrationFlags,
} from "./relational-order-orchestration.types";

function stepStatus(
  index: number,
  currentIndex: number,
): "done" | "current" | "pending" {
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "current";
  return "pending";
}

function statusIndex(status: RelationalCommercialOrder["status"]): number {
  const map: Record<string, number> = {
    CREATED: 1,
    VALIDATED: 2,
    PREPARING: 3,
    READY_FOR_LOADING: 4,
    IN_TRANSIT: 5,
    DELIVERY_PENDING: 6,
    DELIVERED: 7,
    RECEPTION_CONFIRMED: 8,
    SETTLEMENT_PENDING: 9,
    SETTLEMENT_CONFIRMED: 10,
    CLOSED: 11,
    INCIDENT_REPORTED: 6,
  };
  return map[status] ?? 0;
}

export function buildOrderTimeline(
  order: RelationalCommercialOrder,
  flags: RelationalOrderOrchestrationFlags = {},
): OrderTimelineStep[] {
  const current = statusIndex(order.status);
  const deliveryOn = isCommercialDeliveryFlowEnabled(flags);
  const settlementOn = isCommercialSettlementFlowEnabled(flags);

  const steps: OrderTimelineStep[] = [
    { id: "product-selected", label: "Produit sélectionné", status: stepStatus(0, current) },
    { id: "order-sent", label: "Commande envoyée", status: stepStatus(1, current), at: "J-1" },
    { id: "partner-validation", label: "Validation partenaire", status: stepStatus(2, current) },
    { id: "preparation", label: "Préparation", status: stepStatus(3, current) },
    { id: "loading", label: "Chargement", status: stepStatus(4, current) },
  ];

  if (deliveryOn) {
    steps.push(
      { id: "shipment", label: "Expédition", status: stepStatus(5, current) },
      { id: "delivery", label: "Livraison", status: stepStatus(6, current) },
      { id: "reception-confirmed", label: "Réception confirmée", status: stepStatus(7, current) },
    );
  }

  if (settlementOn && order.settlement) {
    steps.push({
      id: "settlement-confirmed",
      label: "Règlement confirmé",
      status: stepStatus(9, current),
    });
  }

  steps.push({
    id: "activity-closed",
    label: "Activité clôturée",
    status: order.status === "CLOSED" ? "done" : stepStatus(10, current),
  });

  return steps;
}
