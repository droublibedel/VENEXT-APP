import type {
  RelationalCatalog,
  RelationalDiscoveryItem,
  RelationalPartner,
} from "./relational-commerce-catalog.types";

import { sanitizeCommerceFoundationText } from "commerce-foundation-guardrails";

export function sanitizeRelationalCommerceText(text: string): string {
  const out = sanitizeCommerceFoundationText(text);
  if (/marketplace|comparateur|amazon|alibaba/i.test(text)) {
    return "Information utile pour votre réseau commercial.";
  }
  return out;
}

export function buildRelationalCatalogSignals(catalog: RelationalCatalog | null): string[] {
  if (!catalog) return [];
  const signals: string[] = [];
  if (catalog.relationshipLevel === "ACTIVE" || catalog.relationshipLevel === "PRIORITY_PARTNER") {
    signals.push("Catalogue partenaire actif");
  }
  if (catalog.products.some((p) => p.badge === "forte-demande")) {
    signals.push("Produit demandé dans votre réseau");
  }
  if (catalog.products.some((p) => p.availability === "limited")) {
    signals.push("Stock limité sur un produit partenaire");
  }
  return signals.map(sanitizeRelationalCommerceText);
}

export function buildPartnerCatalogHints(partner: RelationalPartner | null): string[] {
  if (!partner) return [];
  const hints: string[] = [];
  if (partner.relationshipLevel === "PRIORITY_PARTNER") {
    hints.push("Partenaire récemment actif");
  } else if (partner.relationshipLevel === "ACTIVE") {
    hints.push("Catalogue disponible dans votre corridor");
  }
  return hints.map(sanitizeRelationalCommerceText);
}

export function buildSponsoredDiscoveryHints(items: RelationalDiscoveryItem[]): string[] {
  return items
    .filter((d) => d.sponsored)
    .map((d) => sanitizeRelationalCommerceText(d.hint))
    .slice(0, 2);
}
