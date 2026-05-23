import {
  buildAccessContext,
  guardMessagingAction,
  withFormalMailAccess,
  withTerrainMessagingAccess,
  type CommerceAccessContext,
} from "commerce-access-control";

export function buildMessagingAccessContext(input: {
  actorRole: "producteur" | "grossiste_a" | "grossiste_b" | "detaillant";
  organizationId: string;
  relationshipId?: string;
  relationshipStatus?: CommerceAccessContext["relationshipStatus"];
  participantStatus?: CommerceAccessContext["participantStatus"];
  flags?: {
    commerce_access_control_enabled?: boolean;
    commerce_conversation_governance_enabled?: boolean;
  };
}): CommerceAccessContext {
  const roleMap = {
    producteur: "PRODUCER",
    grossiste_a: "GROSSISTE_A",
    grossiste_b: "GROSSISTE_B",
    detaillant: "DETAILLANT",
  } as const;
  return buildAccessContext({
    actorRole: roleMap[input.actorRole],
    organizationId: input.organizationId,
    relationshipId: input.relationshipId,
    relationshipStatus: input.relationshipStatus ?? "ACTIVE",
    participantStatus: input.participantStatus ?? "ACTIVE",
    flags: input.flags,
  });
}

export function canUseTerrainMessagingWithAccess(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  return withTerrainMessagingAccess(ctx, fallback);
}

export function canUseFormalMailWithAccess(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  return withFormalMailAccess(ctx, fallback);
}

export function isParticipantMessagingAllowed(ctx: CommerceAccessContext): boolean {
  return guardMessagingAction(ctx, "participant").allowed;
}
