import { isCommercialReceptionConfirmationEnabled } from "./commercial-delivery-governance";
import type {
  CommercialDelivery,
  CommercialDeliveryFlowFlags,
  DeliveryTimelineStep,
} from "./commercial-delivery-flow.types";

function stepStatus(index: number, current: number): "done" | "current" | "pending" {
  if (index < current) return "done";
  if (index === current) return "current";
  return "pending";
}

function statusIndex(status: CommercialDelivery["status"]): number {
  const map: Record<string, number> = {
    DELIVERY_CREATED: 0,
    PREPARING_LOADING: 0,
    READY_FOR_DISPATCH: 1,
    ON_THE_WAY: 2,
    ARRIVING: 3,
    DELIVERED: 4,
    RECEPTION_CONFIRMED: 5,
    DELIVERY_DELAYED: 2,
    DELIVERY_INCIDENT: 2,
    CLOSED: 6,
  };
  return map[status] ?? 0;
}

export function buildDeliveryTimeline(
  delivery: CommercialDelivery,
  flags: CommercialDeliveryFlowFlags = {},
): DeliveryTimelineStep[] {
  const current = statusIndex(delivery.status);
  const receptionOn = isCommercialReceptionConfirmationEnabled(flags);

  const steps: DeliveryTimelineStep[] = [
    { id: "loading-prep", label: "Chargement préparation", status: stepStatus(0, current) },
    { id: "departure", label: "Départ livraison", status: stepStatus(1, current), at: "Matin" },
    { id: "on-route", label: "Livraison en route", status: stepStatus(2, current) },
    { id: "arriving", label: "Arrivée proche", status: stepStatus(3, current) },
    { id: "delivered", label: "Livraison effectuée", status: stepStatus(4, current) },
  ];

  if (receptionOn) {
    steps.push({
      id: "reception-confirmed",
      label: "Réception confirmée",
      status: stepStatus(5, current),
    });
  }

  steps.push({
    id: "activity-closed",
    label: "Activité clôturée",
    status: delivery.status === "CLOSED" ? "done" : stepStatus(6, current),
  });

  return steps;
}
