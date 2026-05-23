import {
  buildLinkedCommerceRelationshipLabel,
  buildRelationshipContext,
  isRelationshipContextEnabled,
  mapSupplierTypeToActorRole,
} from "commercial-relationship-governance";

import { humanDeliveryStatusLabel } from "./commercial-delivery-governance";
import type {
  CommercialDelivery,
  CommercialDeliveryActorRole,
  CommercialDeliveryFlowFlags,
  CommercialDeliveryRoute,
  CommercialDeliveryStatus,
} from "./commercial-delivery-flow.types";

import { sanitizeDeliveryFoundationText } from "commerce-foundation-guardrails";

export function sanitizeCommercialDeliveryText(text: string): string {
  return sanitizeDeliveryFoundationText(text);
}

export function buildDeliveryFlowSignals(delivery: CommercialDelivery | null): string[] {
  if (!delivery) return [];
  const signals: string[] = [];

  if (delivery.status === "ON_THE_WAY" || delivery.status === "ARRIVING") {
    signals.push("Livraison en route");
  }
  if (delivery.status === "RECEPTION_CONFIRMED") {
    signals.push("Réception partenaire confirmée");
  }
  if (delivery.sponsoredCorridor) {
    signals.push("Activité corridor active");
  }
  if (delivery.status === "ARRIVING") {
    signals.push("Livraison proche de destination");
  }
  if (delivery.status === "DELIVERED") {
    signals.push("Confirmation terrain reçue");
  }
  const label = humanDeliveryStatusLabel(delivery.status);
  if (label && signals.length < 3) signals.push(label);

  return signals.map(sanitizeCommercialDeliveryText).slice(0, 4);
}

export function buildDeliveryProgressHints(status: CommercialDeliveryStatus): string[] {
  const hints: string[] = [];
  if (["DELIVERY_CREATED", "PREPARING_LOADING", "READY_FOR_DISPATCH"].includes(status)) {
    hints.push("La marchandise se prépare pour votre partenaire");
  }
  if (["ON_THE_WAY", "ARRIVING"].includes(status)) {
    hints.push("Le commerce avance — votre partenaire suit l'activité");
  }
  if (status === "DELIVERY_DELAYED") {
    hints.push("Légère attente — votre relation commerciale continue");
  }
  return hints.map(sanitizeCommercialDeliveryText);
}

export function buildReceptionSignals(delivery: CommercialDelivery | null): string[] {
  if (!delivery) return [];
  const signals: string[] = [];
  if (delivery.status === "DELIVERED") {
    signals.push(`Confirmez la réception à ${delivery.partner.displayName}`);
  }
  if (delivery.status === "RECEPTION_CONFIRMED") {
    signals.push("Réception partenaire confirmée");
  }
  return signals.map(sanitizeCommercialDeliveryText);
}

export function buildCommercialCorridorHints(route: CommercialDeliveryRoute): string[] {
  const hints: string[] = [];
  if (route.corridorLabel) {
    hints.push(`Corridor ${route.corridorLabel}`);
  }
  hints.push(`${route.originCity} → ${route.destinationCity}`);
  return hints.map(sanitizeCommercialDeliveryText);
}

export function buildRelationshipDeliveryHints(
  actorRole: CommercialDeliveryActorRole,
  delivery: CommercialDelivery | null,
  flags: CommercialDeliveryFlowFlags = {},
): string[] {
  if (!delivery || !isRelationshipContextEnabled(flags)) return [];
  const partnerRole = mapSupplierTypeToActorRole(delivery.partner.partnerType ?? "detaillant");
  const ctx = buildRelationshipContext(
    { self: actorRole, partner: partnerRole },
    { flags, corridorLabel: delivery.route.corridorLabel },
  );
  const hints = [buildLinkedCommerceRelationshipLabel(ctx)];
  if (delivery.links.orderId) {
    hints.push("Livraison liée — commande contextualisée par la relation");
  }
  return hints.map(sanitizeCommercialDeliveryText).slice(0, 3);
}
