import {
  buildAccessContext,
  guardWalletAction,
  withWalletAccess,
  withWalletActionAccess,
  type CommerceAccessContext,
} from "commerce-access-control";

export type WalletAccessBridgeInput = {
  organizationId: string;
  actorRole?: "producteur" | "grossiste_a" | "grossiste_b" | "detaillant";
  relationshipId?: string;
  commerce_access_control_enabled?: boolean;
  commerce_visibility_guard_enabled?: boolean;
  commerce_backend_access_guard_enabled?: boolean;
  walletSecurityMode?: CommerceAccessContext["walletSecurityMode"];
  connectivity?: CommerceAccessContext["connectivity"];
  relationshipStatus?: CommerceAccessContext["relationshipStatus"];
};

export function buildWalletAccessContext(input: WalletAccessBridgeInput): CommerceAccessContext {
  const roleMap: Record<string, CommerceAccessContext["actorRole"]> = {
    producteur: "PRODUCER",
    grossiste_a: "GROSSISTE_A",
    grossiste_b: "GROSSISTE_B",
    detaillant: "DETAILLANT",
  };
  return buildAccessContext({
    actorRole: roleMap[input.actorRole ?? "grossiste_b"] ?? "GROSSISTE_B",
    organizationId: input.organizationId,
    walletOwnerOrganizationId: input.organizationId,
    relationshipId: input.relationshipId,
    relationshipStatus: input.relationshipStatus ?? "ACTIVE",
    walletSecurityMode: input.walletSecurityMode ?? "standard",
    connectivity: input.connectivity ?? "ONLINE",
    flags: input,
  });
}

export function canUseWalletWithAccess(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  return withWalletAccess(ctx, fallback) && guardWalletAction(ctx, "access").allowed;
}

export function canSettleWithAccess(ctx: CommerceAccessContext): boolean {
  return withWalletActionAccess(ctx, "settlement", () => true);
}

export function isWalletOwnerOnly(ctx: CommerceAccessContext): boolean {
  return ctx.organizationId === ctx.walletOwnerOrganizationId;
}
