"use client";

import { memo } from "react";

import type { CommercialDelivery } from "./commercial-delivery-flow.types";

function CommercialDeliveryActivityFeedInner({
  delivery,
  onOpenOrder,
  onOpenActivity,
}: {
  delivery: CommercialDelivery;
  onOpenOrder?: (orderId: string) => void;
  onOpenActivity?: (activityId: string) => void;
}) {
  const items: { label: string; testId: string; onClick?: () => void }[] = [];

  if (delivery.links.orderReference) {
    items.push({
      label: `Commande ${delivery.links.orderReference}`,
      testId: "cdf-activity-order",
      onClick: delivery.links.orderId ? () => onOpenOrder?.(delivery.links.orderId!) : undefined,
    });
  }
  if (delivery.settlement) {
    items.push({
      label: `Règlement : ${delivery.settlement.statusLabel}`,
      testId: "cdf-activity-settlement",
    });
  }
  if (delivery.sponsoredCorridor) {
    items.push({ label: "Corridor sponsor actif", testId: "cdf-activity-corridor" });
  }
  if (delivery.status === "RECEPTION_CONFIRMED") {
    items.push({ label: "Réception confirmée", testId: "cdf-activity-reception" });
  }
  if (delivery.links.activityId) {
    items.push({
      label: "Activité partenaire liée",
      testId: "cdf-activity-linked",
      onClick: () => onOpenActivity?.(delivery.links.activityId!),
    });
  }

  return (
    <section className="cdf-panel" data-testid="cdf-activity-feed">
      <h4 className="cdf-panel-title">Activité commerciale liée</h4>
      <ul className="cdf-activity-list">
        {items.map((item) => (
          <li key={item.testId} data-testid={item.testId}>
            {item.onClick ? (
              <button type="button" className="cdf-btn cdf-btn--link" onClick={item.onClick}>
                {item.label}
              </button>
            ) : (
              item.label
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export const CommercialDeliveryActivityFeed = memo(CommercialDeliveryActivityFeedInner);
