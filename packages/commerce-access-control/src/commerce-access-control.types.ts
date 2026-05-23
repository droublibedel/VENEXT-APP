import type { CommercialActorRole as GovActorRole } from "commercial-relationship-governance";

export type CommerceAccessActorRole =
  | "PRODUCER"
  | "GROSSISTE_A"
  | "GROSSISTE_B"
  | "DETAILLANT";

export type CommerceRelationshipStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REMOVED";

export type CommerceWalletSecurityMode = "standard" | "elevated" | "locked" | "offline_wait";

export type CommerceAccessResource =
  | "relational_catalog"
  | "order"
  | "delivery"
  | "settlement"
  | "wallet"
  | "messaging"
  | "mail"
  | "notifications"
  | "activity_feed"
  | "offline_cache"
  | "partner_profile"
  | "relationship";

export type CommerceAccessFlags = {
  commerce_access_control_enabled?: boolean;
  commerce_visibility_guard_enabled?: boolean;
  commerce_backend_access_guard_enabled?: boolean;
  commercial_relationship_governance_enabled?: boolean;
  venext_live_data_fallback_enabled?: boolean;
};

export type CommerceAccessContext = {
  actorRole: CommerceAccessActorRole;
  organizationId: string;
  partnerRole?: CommerceAccessActorRole;
  partnerOrganizationId?: string;
  relationshipId?: string;
  relationshipStatus?: CommerceRelationshipStatus;
  relationshipLevel?: string;
  catalogVisibility?: "RELATION_ONLY" | "PARTNER_APPROVED" | "SPONSORED" | "HIDDEN" | "GLOBAL";
  buyerOrganizationId?: string;
  sellerOrganizationId?: string;
  walletOwnerOrganizationId?: string;
  walletSecurityMode?: CommerceWalletSecurityMode;
  connectivity?: "ONLINE" | "DEGRADED" | "OFFLINE";
  participantStatus?: "ACTIVE" | "SUSPENDED";
  flags?: CommerceAccessFlags;
};

export type CommercePermissions = {
  canViewRelationalCatalog: boolean;
  canCreateOrder: boolean;
  canViewOrder: boolean;
  canUpdateOrderStatus: boolean;
  canViewDelivery: boolean;
  canConfirmDelivery: boolean;
  canViewSettlement: boolean;
  canConfirmSettlement: boolean;
  canUseWallet: boolean;
  canUseTerrainMessaging: boolean;
  canUseFormalMail: boolean;
  canViewNotifications: boolean;
  canViewActivityFeed: boolean;
  canUseOfflineCache: boolean;
  canViewPartnerProfile: boolean;
  canAutoAcceptRelationship: boolean;
};

export type CommerceAccessDecision = {
  allowed: boolean;
  errorCode?: CommerceAccessErrorCode;
  userMessage?: string;
};

export type CommerceAccessErrorCode =
  | "catalog_unavailable"
  | "relation_inactive"
  | "order_not_accessible"
  | "settlement_not_allowed"
  | "offline_action_unavailable"
  | "partner_only"
  | "wallet_not_owner"
  | "messaging_not_allowed"
  | "messaging_participant_suspended"
  | "mail_not_allowed"
  | "global_catalog_forbidden";

export type GovRole = GovActorRole;
