export type EnterpriseGovernanceApiFamily = "LEGACY_COMMERCE_FOUNDATION" | "ENTERPRISE_GOVERNANCE_LIVE";

export type EnterpriseGovernanceApiStatus = "SOURCE_OF_TRUTH" | "LEGACY_COMPATIBILITY" | "DEPRECATED";

export type EnterpriseGovernanceSourceOfTruth = "LIVE_PERSISTENCE" | "MEMORY_DEV_ONLY";

export type EnterpriseGovernanceRouteKind =
  | "channels_list"
  | "channel_detail"
  | "channel_poles"
  | "channel_invitations"
  | "channel_collaborators"
  | "channel_security_alerts"
  | "channel_timeline"
  | "channel_status_patch"
  | "legacy_activation_queue"
  | "legacy_security_actions"
  | "legacy_security_history"
  | "legacy_security_alerts_query";

const LIVE_ROUTES: Record<EnterpriseGovernanceRouteKind, string> = {
  channels_list: "/commerce-foundation/enterprise/channels",
  channel_detail: "/commerce-foundation/enterprise/channels/:enterpriseId",
  channel_poles: "/commerce-foundation/enterprise/channels/:enterpriseId/poles",
  channel_invitations: "/commerce-foundation/enterprise/channels/:enterpriseId/invitations",
  channel_collaborators: "/commerce-foundation/enterprise/channels/:enterpriseId/collaborators",
  channel_security_alerts: "/commerce-foundation/enterprise/channels/:enterpriseId/security-alerts",
  channel_timeline: "/commerce-foundation/enterprise/channels/:enterpriseId/timeline",
  channel_status_patch: "/commerce-foundation/enterprise/channels/:enterpriseId/status",
  legacy_activation_queue: "/commerce-foundation/enterprise/activation-queue",
  legacy_security_actions: "/commerce-foundation/enterprise/security/actions",
  legacy_security_history: "/commerce-foundation/enterprise/security/history",
  legacy_security_alerts_query: "/commerce-foundation/enterprise/security/alerts",
};

const ROUTE_META: Record<
  EnterpriseGovernanceRouteKind,
  { family: EnterpriseGovernanceApiFamily; status: EnterpriseGovernanceApiStatus; source: EnterpriseGovernanceSourceOfTruth }
> = {
  channels_list: { family: "ENTERPRISE_GOVERNANCE_LIVE", status: "SOURCE_OF_TRUTH", source: "LIVE_PERSISTENCE" },
  channel_detail: { family: "ENTERPRISE_GOVERNANCE_LIVE", status: "SOURCE_OF_TRUTH", source: "LIVE_PERSISTENCE" },
  channel_poles: { family: "ENTERPRISE_GOVERNANCE_LIVE", status: "SOURCE_OF_TRUTH", source: "LIVE_PERSISTENCE" },
  channel_invitations: { family: "ENTERPRISE_GOVERNANCE_LIVE", status: "SOURCE_OF_TRUTH", source: "LIVE_PERSISTENCE" },
  channel_collaborators: { family: "ENTERPRISE_GOVERNANCE_LIVE", status: "SOURCE_OF_TRUTH", source: "LIVE_PERSISTENCE" },
  channel_security_alerts: { family: "ENTERPRISE_GOVERNANCE_LIVE", status: "SOURCE_OF_TRUTH", source: "LIVE_PERSISTENCE" },
  channel_timeline: { family: "ENTERPRISE_GOVERNANCE_LIVE", status: "SOURCE_OF_TRUTH", source: "LIVE_PERSISTENCE" },
  channel_status_patch: { family: "ENTERPRISE_GOVERNANCE_LIVE", status: "SOURCE_OF_TRUTH", source: "LIVE_PERSISTENCE" },
  legacy_activation_queue: { family: "LEGACY_COMMERCE_FOUNDATION", status: "LEGACY_COMPATIBILITY", source: "MEMORY_DEV_ONLY" },
  legacy_security_actions: { family: "LEGACY_COMMERCE_FOUNDATION", status: "LEGACY_COMPATIBILITY", source: "MEMORY_DEV_ONLY" },
  legacy_security_history: { family: "LEGACY_COMMERCE_FOUNDATION", status: "LEGACY_COMPATIBILITY", source: "MEMORY_DEV_ONLY" },
  legacy_security_alerts_query: { family: "LEGACY_COMMERCE_FOUNDATION", status: "LEGACY_COMPATIBILITY", source: "MEMORY_DEV_ONLY" },
};

export function resolveEnterpriseGovernanceApiRoute(
  kind: EnterpriseGovernanceRouteKind,
  params?: { enterpriseId?: string },
): string {
  let path = LIVE_ROUTES[kind];
  if (params?.enterpriseId) {
    path = path.replace(":enterpriseId", encodeURIComponent(params.enterpriseId));
  }
  return path;
}

export function assertEnterpriseGovernanceRouteIsLive(kind: EnterpriseGovernanceRouteKind): void {
  const meta = ROUTE_META[kind];
  if (meta.family !== "ENTERPRISE_GOVERNANCE_LIVE") {
    throw new Error(`enterprise_governance_route_not_live:${kind}`);
  }
}

export function enterpriseGovernanceRouteMeta(kind: EnterpriseGovernanceRouteKind) {
  return ROUTE_META[kind];
}

const legacyWarned = new Set<string>();

/** Log DEV uniquement — pas de bruit PROD. */
export function warnEnterpriseGovernanceLegacyRoute(kind: EnterpriseGovernanceRouteKind): void {
  const meta = ROUTE_META[kind];
  if (meta.family !== "LEGACY_COMMERCE_FOUNDATION") return;
  const nodeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV;
  if (nodeEnv === "production") return;
  if (legacyWarned.has(kind)) return;
  legacyWarned.add(kind);
  console.warn(
    "[VENEXT] Enterprise governance legacy API used. Prefer enterprise-governance-live routes.",
    resolveEnterpriseGovernanceApiRoute(kind),
  );
}

export function resetEnterpriseGovernanceLegacyWarningsForTests(): void {
  legacyWarned.clear();
}
