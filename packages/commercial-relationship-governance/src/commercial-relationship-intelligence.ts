import { sanitizeCommerceFoundationText } from "commerce-foundation-guardrails";

import { resolveRelationshipGovernance } from "./commercial-relationship-governance";
import type {
  ActorPair,
  CommercialRelationshipContext,
  CommercialRelationshipGovernanceFlags,
  CommercialRelationshipLevel,
} from "./commercial-relationship.types";

const FORBIDDEN = /\b(followers|likes|feed public|marketplace globale|graphe visible|notation sociale)\b/i;

export function sanitizeRelationshipText(text: string): string {
  if (FORBIDDEN.test(text)) {
    return "Relation commerciale dans votre réseau.";
  }
  return sanitizeCommerceFoundationText(text);
}

export function buildRelationshipContext(
  pair: ActorPair,
  input: {
    level?: CommercialRelationshipLevel;
    flags?: CommercialRelationshipGovernanceFlags;
    corridorLabel?: string;
  } = {},
): CommercialRelationshipContext {
  const governance = resolveRelationshipGovernance(pair, {
    level: input.level,
    flags: input.flags,
    corridorActive: Boolean(input.corridorLabel),
  });
  return {
    type: governance.relationshipType,
    level: input.level ?? "RETAIL_PARTNER",
    governance,
    corridorLabel: input.corridorLabel,
  };
}

export function buildRelationshipHints(ctx: CommercialRelationshipContext): string[] {
  const hints: string[] = [];
  const g = ctx.governance;

  if (g.conditional) {
    hints.push("Relation conditionnelle — corridor ou partenaire validé");
  }
  if (g.sponsorshipEnabled && ctx.corridorLabel) {
    hints.push(sanitizeRelationshipText(`Corridor actif : ${ctx.corridorLabel}`));
  }
  if (g.preferMessaging) {
    hints.push("Communication commerce rapide pour cette relation");
  } else if (g.preferMail) {
    hints.push("Échanges professionnels pour cette relation");
  }
  if (g.autoAccept === "auto") {
    hints.push("Acceptation partenaire souvent automatique sur ce lien");
  } else if (g.autoAccept === "manual") {
    hints.push("Validation partenaire attendue");
  }

  return hints.map(sanitizeRelationshipText).slice(0, 4);
}

export function buildLinkedCommerceRelationshipLabel(ctx: CommercialRelationshipContext): string {
  return sanitizeRelationshipText(
    `Activité liée — ${ctx.type.replace(/_/g, " ").toLowerCase()}`,
  );
}
