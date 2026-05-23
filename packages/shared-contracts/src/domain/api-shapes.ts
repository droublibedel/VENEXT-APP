import { z } from "zod";

/** Core-domain-service GET /v1/users/:id */
export const UserPublicSchema = z.object({
  id: z.string().uuid(),
  phoneNumber: z.string(),
  phoneVerified: z.boolean(),
  email: z.string().nullable(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
  preferredLanguage: z.enum(["fr", "en", "ar", "zh"]),
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type UserPublic = z.infer<typeof UserPublicSchema>;

export const OrganizationPublicSchema = z.object({
  id: z.string().uuid(),
  /** Public 10-digit commercial network ID (Instruction 4A). */
  commercialId: z.string().length(10).regex(/^\d+$/),
  ownerUserId: z.string().uuid(),
  displayName: z.string(),
  legalName: z.string().nullable(),
  activityLabel: z.string(),
  actorType: z.enum([
    "INDUSTRIAL_PRODUCER",
    "WHOLESALER",
    "RETAILER",
    "BACKOFFICE",
  ]),
  category: z.enum([
    "PRODUCER",
    "WHOLESALER_A",
    "WHOLESALER_B",
    "RETAILER",
    "INTERNAL_ADMIN",
  ]),
  profileImageUrl: z.string().nullable(),
  country: z.string(),
  city: z.string(),
  commune: z.string().nullable(),
  address: z.string().nullable(),
  verificationStatus: z.enum([
    "UNVERIFIED",
    "PENDING",
    "VERIFIED",
    "REJECTED",
  ]),
  credibilityScore: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type OrganizationPublic = z.infer<typeof OrganizationPublicSchema>;

export const RelationshipEdgeSchema = z.object({
  id: z.string().uuid(),
  requesterOrganizationId: z.string().uuid(),
  receiverOrganizationId: z.string().uuid(),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "BLOCKED"]),
  source: z.enum([
    "PHONE_CONTACT",
    "NETWORK_CODE",
    "MANUAL_INVITATION",
    "SPONSORED_DISCOVERY",
    "BACKOFFICE_CREATED",
  ]),
  upstreamOrganizationId: z.string().uuid(),
  downstreamOrganizationId: z.string().uuid(),
  createdAt: z.coerce.date(),
  acceptedAt: z.coerce.date().nullable(),
  rejectedAt: z.coerce.date().nullable(),
});
export type RelationshipEdge = z.infer<typeof RelationshipEdgeSchema>;

export const FeatureFlagRowSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  scopeType: z.enum([
    "GLOBAL",
    "COUNTRY",
    "REGION",
    "ORGANIZATION",
    "ROLE",
  ]),
  scopeValue: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type FeatureFlagRow = z.infer<typeof FeatureFlagRowSchema>;
