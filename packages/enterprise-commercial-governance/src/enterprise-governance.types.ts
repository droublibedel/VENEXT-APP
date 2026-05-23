export type AccountSegment = "SMALL_ACCOUNTS" | "LARGE_ACCOUNTS";

export type EnterpriseGovernanceStatus =
  | "DRAFT"
  | "CONTRACT_PENDING"
  | "CHANNEL_OPEN"
  | "POLES_ACTIVATING"
  | "ONBOARDING"
  | "PENDING_VALIDATION"
  | "ACTIVE"
  | "SUSPENDED"
  | "ARCHIVED"
  | "CLOSED";

export type EnterpriseActivationStatus =
  | "PENDING_VALIDATION"
  | "ACTIVE"
  | "BLOCKED"
  | "REJECTED"
  | "SUSPENDED"
  | "ARCHIVED";

export type GovernanceLevel = "VENEXT_GLOBAL" | "PARTNER_SECURITY";

export type EnterpriseSecurityActionType =
  | "SUSPEND_USER"
  | "REACTIVATE_USER"
  | "REPLACE_USER"
  | "ARCHIVE_USER"
  | "APPROVE_DEVICE"
  | "REVOKE_DEVICE"
  | "INVALIDATE_SESSION"
  | "ARCHIVE_ENTERPRISE"
  | "REACTIVATE_ENTERPRISE";

export type GovernanceActionNote = {
  id: string;
  actionType: EnterpriseSecurityActionType;
  author: string;
  authorLevel: GovernanceLevel;
  target: string;
  reason: string;
  optionalDocument?: string;
  createdAt: string;
};

export type EnterpriseGovernanceHistoryEntry = {
  id: string;
  enterpriseId: string;
  action: EnterpriseSecurityActionType;
  author: string;
  authorLevel: GovernanceLevel;
  target: string;
  note: string;
  document?: string;
  previousState: string;
  newState: string;
  createdAt: string;
};

export type EnterpriseSecurityAlert = {
  id: string;
  enterpriseId: string;
  alertType:
    | "unusual_login"
    | "unknown_ip"
    | "unknown_device"
    | "too_many_attempts"
    | "invitation_expired";
  message: string;
  severity: "info" | "warning";
  createdAt: string;
  acknowledged?: boolean;
};

export type EnterpriseConnectionActivity = {
  id: string;
  enterpriseId: string;
  internalEnterpriseUserId?: string;
  ipAddress?: string;
  machineFingerprint?: string;
  success: boolean;
  suspicious: boolean;
  createdAt: string;
};

export type EnterpriseOnboardingStepId =
  | "commercial_meeting"
  | "contract_signed"
  | "contract_scan"
  | "channel_open"
  | "enterprise_dossier"
  | "poles_activation"
  | "secure_links"
  | "collaborator_registration"
  | "human_validation"
  | "platform_activation";

export type EnterpriseCommercialChannel = {
  enterpriseId: string;
  accountSegment: "LARGE_ACCOUNTS";
  actorKind: "producteur" | "grossiste_a";
  contractReference: string;
  signedAt?: string;
  companyName: string;
  companyLogo?: string;
  headquarters: string;
  postalBox?: string;
  companyPhone?: string;
  professionalEmail?: string;
  directorInformation?: string;
  commercialEssentials?: string;
  governanceStatus: EnterpriseGovernanceStatus;
  onboardingProgress: number;
  activationStatus: EnterpriseActivationStatus;
  professionalContacts?: { name: string; role: string; email?: string; phone?: string }[];
  contractScanUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type VenextCanonicalPole = {
  poleId: string;
  label: string;
  shortLabel: string;
  /** Pôle déjà présent dans VENEXT — non créable par le client */
  readonly existingInVenext: true;
};

export type EnterprisePoleActivation = {
  id: string;
  enterpriseId: string;
  poleId: string;
  poleLabel: string;
  activated: boolean;
  secureSlug: string;
  privateUrl: string;
  activationCode?: string;
  collaboratorEmail?: string;
  collaboratorName?: string;
  linkExpiresAt?: string;
  createdAt: string;
};

export type EnterpriseSecureInvitation = {
  token: string;
  enterpriseId: string;
  poleId: string;
  poleLabel: string;
  activationCode: string;
  expiresAt: string;
  usedAt?: string;
  revokedAt?: string;
  collaboratorDraft?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    idDocumentNumber?: string;
  };
};

export type EnterpriseCollaboratorOnboarding = {
  internalEnterpriseUserId: string;
  enterpriseId: string;
  poleId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  idDocumentNumber: string;
  idDocumentScanUrl?: string;
  status: EnterpriseActivationStatus;
  machineFingerprint?: string;
  ipAddress?: string;
  otpVerified?: boolean;
  archivedAt?: string;
  replacedByInternalUserId?: string;
  createdAt: string;
};

export type EnterpriseTrustedDevice = {
  id: string;
  internalEnterpriseUserId: string;
  enterpriseId: string;
  label: string;
  fingerprint: string;
  status: "APPROVED" | "SUSPENDED" | "REVOKED";
  lastSeenAt?: string;
};

export type EnterpriseTrustedIp = {
  id: string;
  enterpriseId: string;
  ipAddress: string;
  label?: string;
  status: "KNOWN" | "BLOCKED";
  lastSeenAt?: string;
};

export type EnterpriseGovernanceFlags = {
  enterprise_governance_enabled?: boolean;
  enterprise_secure_channels_enabled?: boolean;
  enterprise_controlled_onboarding_enabled?: boolean;
  enterprise_security_governance_enabled?: boolean;
  enterprise_archive_workflow_enabled?: boolean;
  enterprise_internal_security_enabled?: boolean;
  enterprise_runtime_security_enabled?: boolean;
  enterprise_invitation_revocation_enabled?: boolean;
  enterprise_navigation_lock_enabled?: boolean;
  enterprise_append_only_history_enabled?: boolean;
};
