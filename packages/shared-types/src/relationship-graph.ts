export type RelationshipEdgeKind =
  | "SUPPLY"
  | "DISTRIBUTION"
  | "LOGISTICS"
  | "FINANCIAL"
  | "DATA_SHARE";

export type RelationshipLifecycle =
  | "INVITED"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

export interface RelationshipEdgeFoundation {
  id: string;
  fromOrganizationId: string;
  toOrganizationId: string;
  kind: RelationshipEdgeKind;
  lifecycle: RelationshipLifecycle;
  trustScore?: number;
  /** Products are never globally visible — only through approved edges */
  catalogScopeId?: string;
}

export interface InvitationFoundation {
  id: string;
  inviterOrgId: string;
  inviteeContactHash: string;
  channel: "CONTACT_SYNC" | "MANUAL" | "REFERRAL";
  otpChallengeId?: string;
  expiresAt: string;
}
