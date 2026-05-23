import { sanitizeCommerceFoundationText } from "./commerce-foundation-wording.guard";
import type { CommerceFoundationFlags } from "./commerce-foundation-philosophy.guard";

const FORBIDDEN_DELIVERY_FEATURES =
  /\b(gps temps réel|real-?time gps|package scan|barcode scan|warehouse mapping|multi-warehouse|fleet tracking|logistics orchestration|route optimization engine|proof of delivery pod system)\b/i;

const FORBIDDEN_DELIVERY_UI = [
  "fleet-map",
  "gps-tracking",
  "warehouse-map",
  "scan-parcel",
  "tms-dashboard",
  "wms-panel",
];

export function assertDeliveryStaysLightweight(featureLabel: string): boolean {
  return !FORBIDDEN_DELIVERY_FEATURES.test(featureLabel);
}

export function assertDeliveryUiAllowed(testId: string | undefined): boolean {
  if (!testId) return true;
  return !FORBIDDEN_DELIVERY_UI.some((f) => testId.includes(f));
}

export function sanitizeDeliveryFoundationText(
  text: string,
  flags?: CommerceFoundationFlags,
): string {
  let out = sanitizeCommerceFoundationText(text, flags);
  if (FORBIDDEN_DELIVERY_FEATURES.test(out)) {
    return "Livraison en cours dans votre activité commerciale.";
  }
  return out;
}

export function deliveryLightweightPrinciples(): string[] {
  return [
    "Livraison relationnelle et commerciale",
    "Confirmations terrain simples",
    "Pas de tracking logistique industriel",
    "Pas de GPS flotte",
  ];
}
