import {
  isCommercialRelationshipGovernanceEnabled,
  resolveRelationshipGovernance,
  type CommercialActorRole,
  type CommercialRelationshipGovernanceFlags,
} from "commercial-relationship-governance";

import type { CommercialContextReference } from "./commercial-context-routing.types";
import type { CommercialScreenIntent } from "./commercial-screen-intent";
import { destinationUsesMessagingNotMail } from "./commercial-actor-destinations";

export function inferPartnerRoleFromReference(
  ref: CommercialContextReference,
  self: CommercialActorRole,
): CommercialActorRole {
  if (ref.partnerId?.includes("producteur")) return "producteur";
  if (ref.partnerId?.includes("grossiste_a")) return "grossiste_a";
  if (ref.partnerId?.includes("grossiste_b")) return "grossiste_b";
  if (ref.partnerId?.includes("detaillant")) return "detaillant";
  if (self === "producteur") return "grossiste_a";
  if (self === "grossiste_a") return "producteur";
  if (self === "grossiste_b") return "detaillant";
  return "grossiste_b";
}

export function isScreenNavigationAllowed(
  actor: CommercialActorRole,
  screenIntent: CommercialScreenIntent,
  reference: CommercialContextReference,
  flags: CommercialRelationshipGovernanceFlags & {
    commercial_context_routing_enabled?: boolean;
  } = {},
): { allowed: boolean; reason?: string } {
  if (flags.commercial_context_routing_enabled === false) {
    return { allowed: false, reason: "routing-disabled" };
  }

  if (!isCommercialRelationshipGovernanceEnabled(flags)) {
    return { allowed: true };
  }

  const partner = inferPartnerRoleFromReference(reference, actor);
  const gov = resolveRelationshipGovernance({ self: actor, partner }, { flags });

  if (!gov.allowed) {
    return { allowed: false, reason: "relationship-not-allowed" };
  }

  if (screenIntent === "view-mail-thread" && gov.preferMessaging) {
    if (destinationUsesMessagingNotMail(actor, screenIntent)) {
      return { allowed: true };
    }
    if (!gov.preferMail) {
      return { allowed: false, reason: "mail-not-for-relationship" };
    }
  }

  if (screenIntent === "view-conversation" && gov.preferMail && actor === "producteur") {
    return { allowed: false, reason: "use-mail-for-formal" };
  }

  if (screenIntent === "view-catalog" && gov.catalogMode === "hidden") {
    return { allowed: false, reason: "catalog-hidden" };
  }

  return { allowed: true };
}
