import {
  buildAccessContext,
  guardCommerceResource,
  type CommerceAccessContext,
  type CommerceAccessResource,
} from "commerce-access-control";

export function buildCoreAccessContext(input: {
  organizationId: string;
  actorRole?: string;
  relationshipId?: string;
  relationshipStatus?: string;
  buyerOrganizationId?: string;
  sellerOrganizationId?: string;
  walletOwnerOrganizationId?: string;
  participantStatus?: "ACTIVE" | "SUSPENDED";
  connectivity?: CommerceAccessContext["connectivity"];
  walletSecurityMode?: CommerceAccessContext["walletSecurityMode"];
}): CommerceAccessContext {
  const role = (input.actorRole ?? "GROSSISTE_B").toUpperCase();
  let mapped: CommerceAccessContext["actorRole"] = "GROSSISTE_B";
  if (role.includes("PRODUCER")) mapped = "PRODUCER";
  else if (role.includes("GROSSISTE_A")) mapped = "GROSSISTE_A";
  else if (role.includes("DETAIL")) mapped = "DETAILLANT";

  return buildAccessContext({
    actorRole: mapped,
    organizationId: input.organizationId,
    relationshipId: input.relationshipId,
    relationshipStatus: (input.relationshipStatus as CommerceAccessContext["relationshipStatus"]) ?? "ACTIVE",
    buyerOrganizationId: input.buyerOrganizationId,
    sellerOrganizationId: input.sellerOrganizationId,
    walletOwnerOrganizationId: input.walletOwnerOrganizationId ?? input.organizationId,
    participantStatus: input.participantStatus,
    connectivity: input.connectivity,
    walletSecurityMode: input.walletSecurityMode,
    flags: {
      commerce_access_control_enabled: true,
      commerce_visibility_guard_enabled: true,
      commerce_backend_access_guard_enabled: true,
    },
  });
}

export function assertCoreCommerceResource(
  input: Parameters<typeof buildCoreAccessContext>[0],
  resource: CommerceAccessResource,
  opts?: { action?: "read" | "write" },
): void {
  const ctx = buildCoreAccessContext(input);
  const decision = guardCommerceResource(ctx, resource, {
    requestedOrganizationId: input.organizationId,
    action: opts?.action ?? "read",
  });
  if (!decision.allowed) {
    throw new Error(decision.userMessage ?? "Action non disponible");
  }
}
