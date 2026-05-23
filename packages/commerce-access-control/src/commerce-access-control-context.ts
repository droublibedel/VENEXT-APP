import type {
  CommerceAccessActorRole,
  CommerceAccessContext,
  CommerceAccessFlags,
} from "./commerce-access-control.types";

export type BuildAccessContextInput = {
  actorRole: CommerceAccessActorRole;
  organizationId: string;
  flags?: CommerceAccessFlags;
  partnerRole?: CommerceAccessActorRole;
  partnerOrganizationId?: string;
  relationshipId?: string;
  relationshipStatus?: CommerceAccessContext["relationshipStatus"];
  relationshipLevel?: string;
  catalogVisibility?: CommerceAccessContext["catalogVisibility"];
  buyerOrganizationId?: string;
  sellerOrganizationId?: string;
  walletOwnerOrganizationId?: string;
  walletSecurityMode?: CommerceAccessContext["walletSecurityMode"];
  connectivity?: CommerceAccessContext["connectivity"];
  participantStatus?: CommerceAccessContext["participantStatus"];
};

export function buildAccessContext(input: BuildAccessContextInput): CommerceAccessContext {
  return {
    actorRole: input.actorRole,
    organizationId: input.organizationId,
    flags: input.flags ?? {},
    partnerRole: input.partnerRole,
    partnerOrganizationId: input.partnerOrganizationId,
    relationshipId: input.relationshipId,
    relationshipStatus: input.relationshipStatus ?? (input.relationshipId ? "ACTIVE" : undefined),
    relationshipLevel: input.relationshipLevel,
    catalogVisibility: input.catalogVisibility ?? (input.relationshipId ? "RELATION_ONLY" : "HIDDEN"),
    buyerOrganizationId: input.buyerOrganizationId,
    sellerOrganizationId: input.sellerOrganizationId,
    walletOwnerOrganizationId: input.walletOwnerOrganizationId ?? input.organizationId,
    walletSecurityMode: input.walletSecurityMode ?? "standard",
    connectivity: input.connectivity ?? "ONLINE",
    participantStatus: input.participantStatus,
  };
}

export function mergeAccessContext(
  base: CommerceAccessContext,
  patch: Partial<CommerceAccessContext>,
): CommerceAccessContext {
  return { ...base, ...patch, flags: { ...base.flags, ...patch.flags } };
}
