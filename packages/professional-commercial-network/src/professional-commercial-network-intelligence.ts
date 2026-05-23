import type { ProfessionalNetworkView, ProfessionalPartner } from "./professional-commercial-network.types";

export type ProfessionalHint = { id: string; text: string };

import { sanitizeCommerceFoundationText } from "commerce-foundation-guardrails";

export function sanitizeProfessionalNetworkText(text: string): string {
  const out = sanitizeCommerceFoundationText(text);
  if (/chatbot|linkedin|whatsapp|telegram|marketplace publique/i.test(text)) {
    return "Signal utile pour votre relation commerciale.";
  }
  return out;
}

export function buildProfessionalRelationshipSignals(
  partners: ProfessionalPartner[],
): ProfessionalHint[] {
  const hints: ProfessionalHint[] = [];
  const active = partners.filter((p) => p.status === "active");
  if (active.length) {
    hints.push({
      id: "prs-active",
      text: sanitizeProfessionalNetworkText("Relation commerciale active."),
    });
  }
  const recent = partners.find((p) => p.lastActivity.includes("Aujourd") || p.lastActivity.includes("Hier"));
  if (recent) {
    hints.push({
      id: "prs-recent",
      text: sanitizeProfessionalNetworkText("Partenaire récemment actif."),
    });
  }
  return hints.slice(0, 2);
}

export function buildProfessionalNetworkHints(view: ProfessionalNetworkView | null): ProfessionalHint[] {
  if (!view) return [];
  const hints = buildProfessionalRelationshipSignals(view.partners);
  if (view.territory.stabilityNote) {
    hints.push({
      id: "pnh-territory",
      text: sanitizeProfessionalNetworkText("Activité de distribution stable."),
    });
  }
  return hints.slice(0, 3);
}

export function buildProfessionalActivityHints(view: ProfessionalNetworkView | null): ProfessionalHint[] {
  if (!view) return [];
  return [
    {
      id: "pah-docs",
      text: sanitizeProfessionalNetworkText("Documents récemment échangés."),
    },
    {
      id: "pah-order",
      text: sanitizeProfessionalNetworkText("Commande partenaire confirmée."),
    },
  ].slice(0, 2);
}
