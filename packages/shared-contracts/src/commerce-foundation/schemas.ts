import { z } from "zod";

export const CommerceDataEnvelopeSchema = z.object({
  dataSource: z.enum(["live", "fallback", "mixed"]),
  fallbackUsed: z.boolean(),
  payload: z.unknown(),
  error: z.string().nullable().optional(),
});

export const ActorProfileContractSchema = z.object({
  id: z.string(),
  actorRole: z.string(),
  displayName: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  city: z.string().optional(),
  activities: z.array(z.string()).default([]),
  businessName: z.string().optional(),
  formalCompany: z.string().optional(),
  onboardingCompleted: z.boolean(),
  locale: z.string(),
  organizationId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CommercialRelationshipContractSchema = z.object({
  id: z.string(),
  actorAId: z.string(),
  actorBId: z.string(),
  relationshipType: z.string(),
  relationshipLevel: z.string(),
  governanceMode: z.string(),
  identityMode: z.string(),
  status: z.string(),
  autoAcceptMode: z.string(),
  visibilityMode: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RelationalCatalogContractSchema = z.object({
  id: z.string(),
  ownerActorId: z.string(),
  partnerActorId: z.string(),
  visibilityMode: z.string(),
  relationshipId: z.string(),
  products: z.array(z.record(z.unknown())),
  sponsored: z.boolean(),
  status: z.string(),
  updatedAt: z.string(),
});

export const CommercialOrderContractSchema = z.object({
  id: z.string(),
  relationshipId: z.string(),
  buyerActorId: z.string(),
  sellerActorId: z.string(),
  catalogId: z.string().optional(),
  status: z.string(),
  lines: z.array(z.record(z.unknown())),
  totalAmount: z.number(),
  settlementStatus: z.string(),
  deliveryStatus: z.string(),
  linkedConversationId: z.string().optional(),
  linkedMailThreadId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CommercialDeliveryContractSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  relationshipId: z.string(),
  status: z.string(),
  originCity: z.string(),
  destinationCity: z.string(),
  corridor: z.string(),
  confirmations: z.array(z.record(z.unknown())),
  incident: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CommercialSettlementContractSchema = z.object({
  id: z.string(),
  orderId: z.string().optional(),
  relationshipId: z.string(),
  payerActorId: z.string(),
  receiverActorId: z.string(),
  method: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  walletDemoMode: z.boolean(),
  confirmationStatus: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CommerceMessageContractSchema = z.object({
  id: z.string(),
  relationshipId: z.string(),
  orderId: z.string().optional(),
  settlementId: z.string().optional(),
  participants: z.array(z.string()),
  mode: z.string(),
  messages: z.array(z.record(z.unknown())),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ProfessionalMailContractSchema = z.object({
  id: z.string(),
  relationshipId: z.string(),
  orderId: z.string().optional(),
  settlementId: z.string().optional(),
  subject: z.string(),
  participants: z.array(z.string()),
  attachmentsMeta: z.array(z.record(z.unknown())),
  messages: z.array(z.record(z.unknown())),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CommercialContextContractSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  activeContext: z.record(z.unknown()),
  history: z.array(z.record(z.unknown())),
  lastWorkspace: z.string().optional(),
  updatedAt: z.string(),
});

export const FeatureFlagContractSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  environment: z.string(),
  actorRole: z.string().optional(),
  updatedAt: z.string(),
});

export const WalletDemoStateContractSchema = z.object({
  organizationId: z.string(),
  balanceFcfa: z.number(),
  availableLabel: z.string(),
  walletActivated: z.boolean(),
  walletDemoMode: z.boolean(),
  securityMode: z.string(),
  transactions: z.array(z.record(z.unknown())),
  kycDemoCompleted: z.boolean().optional(),
  pinConfigured: z.boolean().optional(),
});

export const CommerceFoundationEntityTypeSchema = z.enum([
  "ActorProfile",
  "CommercialRelationship",
  "RelationalCatalog",
  "CommercialOrder",
  "CommercialDelivery",
  "CommercialSettlement",
  "CommerceMessageThread",
  "ProfessionalMailThread",
  "CommercialContextState",
  "FeatureFlagState",
  "WalletDemoState",
  "CommerceNotification",
  "CommerceNotificationPreferences",
  "CommerceActivityFeed",
  "CommerceOfflineSnapshot",
  "EnterpriseCommercialChannel",
  "EnterprisePoleActivation",
  "EnterpriseSecureInvitation",
  "EnterpriseCollaboratorOnboarding",
  "EnterpriseTrustedDevice",
  "EnterpriseGovernanceHistory",
  "GovernanceActionNote",
  "TerrainBusinessIdentity",
]);

export type CommerceFoundationEntityType = z.infer<typeof CommerceFoundationEntityTypeSchema>;
