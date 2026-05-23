import {
  buildAccessContext,
  guardOrderAction,
  withOrderAccess,
  withOrderActionAccess,
  type CommerceAccessContext,
} from "commerce-access-control";

import type { RelationalOrderActorRole, RelationalOrderOrchestrationFlags } from "./relational-order-orchestration.types";

export function buildOrderAccessContext(input: {
  actorRole: RelationalOrderActorRole;
  organizationId: string;
  relationshipId?: string;
  relationshipStatus?: CommerceAccessContext["relationshipStatus"];
  buyerOrganizationId?: string;
  sellerOrganizationId?: string;
  flags?: RelationalOrderOrchestrationFlags & {
    commerce_access_control_enabled?: boolean;
  };
}): CommerceAccessContext {
  const roleMap: Record<RelationalOrderActorRole, CommerceAccessContext["actorRole"]> = {
    producteur: "PRODUCER",
    grossiste_a: "GROSSISTE_A",
    grossiste_b: "GROSSISTE_B",
    detaillant: "DETAILLANT",
  };
  return buildAccessContext({
    actorRole: roleMap[input.actorRole],
    organizationId: input.organizationId,
    relationshipId: input.relationshipId,
    relationshipStatus: input.relationshipStatus ?? "ACTIVE",
    buyerOrganizationId: input.buyerOrganizationId,
    sellerOrganizationId: input.sellerOrganizationId,
    flags: input.flags,
  });
}

export function canViewOrderWithAccess(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  return withOrderAccess(ctx, fallback) && guardOrderAction(ctx, "read").allowed;
}

export function canCreateOrderWithAccess(ctx: CommerceAccessContext): boolean {
  return guardOrderAction(ctx, "create").allowed;
}

export function canTrackOrderWithAccess(ctx: CommerceAccessContext): boolean {
  return withOrderActionAccess(ctx, "track", () => true);
}
