import { ForbiddenException } from "@nestjs/common";
import {
  buildSafeMessagingAccessContext,
  evaluateMessagingGuardPriority,
  invalidateMessagingAccessRuntime,
  MESSAGING_SUSPENDED_UX,
  resetCommerceAccessTestState,
} from "commerce-access-control";

import { assertCoreCommerceResource } from "./commerce-access-guard.mapper";

export {
  buildSafeMessagingAccessContext,
  freezeMessagingAccessContext,
  invalidateMessagingAccessRuntime,
  MESSAGING_SUSPENDED_UX,
  resetCommerceAccessTestState,
} from "commerce-access-control";

const UX = {
  messaging: "Messagerie non disponible dans ce contexte",
  mail: "Mail professionnel non disponible ici",
} as const;

export type AssertMessagingAccessInput = {
  organizationId: string;
  actorRole?: string;
  relationshipId?: string;
  participantStatus?: "ACTIVE" | "SUSPENDED";
  formal?: boolean;
  route?: string;
};

/** Garde messaging — suspension prioritaire (Instruction 20.86-E1). */
function mapActorRole(raw?: string): "GROSSISTE_B" | "GROSSISTE_A" | "PRODUCER" | "DETAILLANT" {
  const role = (raw ?? "GROSSISTE_B").toUpperCase();
  if (role.includes("PRODUCER")) return "PRODUCER";
  if (role.includes("GROSSISTE_A")) return "GROSSISTE_A";
  if (role.includes("DETAIL")) return "DETAILLANT";
  return "GROSSISTE_B";
}

export function assertMessagingAccess(input: AssertMessagingAccessInput): void {
  const safe = buildSafeMessagingAccessContext({
    organizationId: input.organizationId,
    actorRole: mapActorRole(input.actorRole),
    relationshipId: input.relationshipId,
    relationshipStatus: "ACTIVE",
    participantStatus: input.participantStatus,
    flags: {
      commerce_access_control_enabled: true,
      commerce_visibility_guard_enabled: true,
      commerce_backend_access_guard_enabled: true,
    },
  });

  const priority = evaluateMessagingGuardPriority(safe, {
    actor: input.organizationId,
    route: input.route ?? (input.formal ? "mail" : "messaging"),
  });
  if (!priority.allowed) {
    throw new ForbiddenException({ userMessage: priority.userMessage });
  }

  try {
    assertCoreCommerceResource(
      {
        organizationId: input.organizationId,
        actorRole: input.actorRole,
        relationshipId: input.relationshipId,
        participantStatus: safe.participantStatus,
        relationshipStatus: "ACTIVE",
      },
      input.formal ? "mail" : "messaging",
    );
  } catch (e) {
    throw new ForbiddenException({
      userMessage: (e as Error).message || (input.formal ? UX.mail : UX.messaging),
    });
  }
}
