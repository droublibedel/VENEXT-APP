export type PlatformHealthComponent =
  | "bff"
  | "core"
  | "database"
  | "auth"
  | "wallet_security"
  | "messaging"
  | "notifications"
  | "offline_sync"
  | "governance_sync";

export type PlatformHealthStatus = "healthy" | "degraded" | "down" | "unknown";

export type PlatformHealthSnapshot = {
  checkedAt: string;
  components: Record<
    PlatformHealthComponent,
    {
      status: PlatformHealthStatus;
      latencyMs?: number;
      message?: string;
      fallbackRate?: number;
    }
  >;
};

export type BackofficeFeatureFlagState = {
  key: string;
  enabled: boolean;
  environment: "development" | "production";
  description?: string;
  lastChangedAt?: string;
  lastChangedBy?: string;
  lastNote?: string;
};

export type BackofficeUserProfile = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  actorRole: string;
  organizationId?: string;
  organizationName?: string;
  city?: string;
  device?: string;
  lastAccessAt?: string;
  sessionActive: boolean;
  securityStatus: "ok" | "suspended" | "archived";
  walletStatus?: string;
};

export type BackofficeEnterpriseProfile = {
  id: string;
  name: string;
  channelStatus: "open" | "pending" | "suspended" | "archived";
  contractRef?: string;
  polesActivated: string[];
  activeCollaborators: number;
  suspendedUsers: number;
  pendingInvitations: number;
  securityAlerts: number;
};

export type BackofficeSearchResult = {
  kind: "user" | "enterprise" | "order" | "error" | "journey" | "support" | "invitation";
  id: string;
  label: string;
  subtitle?: string;
  href: string;
};

export type BackofficeDocumentRef = {
  id: string;
  title: string;
  kind: "contract" | "cessation" | "justificatif" | "governance";
  enterpriseId?: string;
  uploadedAt: string;
  fileRef: string;
};

export type BackofficeAppObservability = {
  application:
    | "mobile-grossiste-b"
    | "mobile-detaillant"
    | "web-grossiste-a"
    | "web-industrial-nextjs"
    | "backoffice-web";
  activeUsers: number;
  errorCount24h: number;
  blockedJourneys24h: number;
  version?: string;
};
