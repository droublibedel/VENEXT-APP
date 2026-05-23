import { z } from "zod";

export const InviteByCommercialIdDtoSchema = z.object({
  requesterOrganizationId: z.string().uuid(),
  targetCommercialId: z.string().min(1),
});
export type InviteByCommercialIdDto = z.infer<
  typeof InviteByCommercialIdDtoSchema
>;

export const CommercialIdPreviewDtoSchema = z.object({
  commercialId: z.string().length(10).regex(/^\d+$/),
  organizationName: z.string(),
  activityLabel: z.string(),
  actorType: z.string(),
  category: z.string(),
  profileImageUrl: z.string().optional(),
  credibilityScore: z.number().optional(),
});
export type CommercialIdPreviewDto = z.infer<
  typeof CommercialIdPreviewDtoSchema
>;

export const InviteByCommercialIdResponseDtoSchema = z.object({
  status: z.string(),
  relationshipId: z.string().uuid(),
  targetPreview: CommercialIdPreviewDtoSchema,
});
export type InviteByCommercialIdResponseDto = z.infer<
  typeof InviteByCommercialIdResponseDtoSchema
>;

export const RelationshipInviteDtoSchema = z.object({
  requesterOrganizationId: z.string().uuid(),
  receiverOrganizationId: z.string().uuid(),
  source: z.enum(["MANUAL_INVITATION", "PHONE_CONTACT", "NETWORK_CODE"]),
  proposedDirection: z
    .object({
      upstreamOrganizationId: z.string().uuid(),
      downstreamOrganizationId: z.string().uuid(),
    })
    .optional(),
});
export type RelationshipInviteDto = z.infer<typeof RelationshipInviteDtoSchema>;

export const RelationshipDecisionDtoSchema = z.object({
  upstreamOrganizationId: z.string().uuid(),
  downstreamOrganizationId: z.string().uuid(),
});
export type RelationshipDecisionDto = z.infer<typeof RelationshipDecisionDtoSchema>;

export const RelationshipPreviewDtoSchema = z.object({
  organization: z.object({
    id: z.string().uuid(),
    commercialId: z.string().length(10).regex(/^\d+$/),
    displayName: z.string(),
    activityLabel: z.string(),
    actorType: z.string(),
    category: z.string(),
    verificationStatus: z.string(),
    credibilityScore: z.number(),
    city: z.string(),
    commune: z.string().nullable(),
    country: z.string(),
    profileImageUrl: z.string().nullable(),
    badges: z.array(z.string()),
  }),
  catalogPreviewCount: z.number(),
  sampleProducts: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      category: z.string(),
    }),
  ),
  relationshipSource: z.string(),
  signalReasons: z.array(z.string()),
});
export type RelationshipPreviewDto = z.infer<typeof RelationshipPreviewDtoSchema>;

export const NetworkCodePreviewDtoSchema = z.object({
  code: z.string(),
  ownerOrganizationId: z.string().uuid(),
  ownerProfile: z.object({
    displayName: z.string(),
    activityLabel: z.string(),
    category: z.string(),
    city: z.string(),
    verificationStatus: z.string(),
  }),
  active: z.boolean(),
  expiresAt: z.coerce.date().nullable(),
  usageRemaining: z.number().nullable(),
});
export type NetworkCodePreviewDto = z.infer<typeof NetworkCodePreviewDtoSchema>;

export const ContactImportDtoSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  contacts: z.array(
    z.object({
      phoneNumber: z.string(),
      localName: z.string().optional(),
    }),
  ),
});
export type ContactImportDto = z.infer<typeof ContactImportDtoSchema>;

export const ContactSuggestionDtoSchema = z.object({
  id: z.string().uuid(),
  suggestedOrganizationId: z.string().uuid(),
  score: z.number(),
  reason: z.string(),
  source: z.string(),
  organizationPreview: z.object({
    displayName: z.string(),
    category: z.string(),
    city: z.string(),
  }),
});
export type ContactSuggestionDto = z.infer<typeof ContactSuggestionDtoSchema>;

export const CatalogVisibilityResultDtoSchema = z.object({
  allowed: z.boolean(),
  reason: z.string(),
  relationshipId: z.string().uuid().optional(),
  visibilityMode: z.string().optional(),
});
export type CatalogVisibilityResultDto = z.infer<
  typeof CatalogVisibilityResultDtoSchema
>;
