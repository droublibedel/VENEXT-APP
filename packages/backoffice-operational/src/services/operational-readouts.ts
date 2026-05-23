import { getBackofficeStore } from "../store/backoffice-store.js";
import type { PlatformHealthSnapshot } from "../types/platform.types.js";
import { maskEmail, maskPhone } from "../privacy/sensitive-data.js";
import { getBackofficeErrorRepository } from "../repositories/backoffice-error.repository.js";
import { getBackofficeJourneyRepository } from "../repositories/backoffice-journey.repository.js";
import { getBackofficeSupportRepository } from "../repositories/backoffice-support.repository.js";
import { getBackofficeEnterpriseGovernanceRepository } from "../repositories/backoffice-enterprise-governance.repository.js";
import { getBackofficeProductHealthEngine } from "../health/product-health-engine.js";
import { detectBrokenJourneyPatterns } from "../journeys/broken-journey-detector.js";
import { getBackofficeAuditRepository } from "../repositories/backoffice-audit.repository.js";
import { getBackofficeInternalNotificationRepository } from "../repositories/backoffice-internal-notification.repository.js";

export type DashboardReadout = {
  activeUsers: number;
  registrationsInProgress: number;
  blockedJourneys: number;
  recentErrors: number;
  enterprisesToValidate: number;
  suspendedAccounts: number;
  securityAlerts: number;
  platformHealth: PlatformHealthSnapshot["components"];
  probableSupportQueue: number;
  brokenPatterns: number;
};

export async function buildDashboardReadout(): Promise<DashboardReadout> {
  const store = getBackofficeStore();
  const [errorsPage, journeysPage, supportPage] = await Promise.all([
    getBackofficeErrorRepository().list({ status: "NEW", pageSize: 200 }),
    getBackofficeJourneyRepository().list({ pageSize: 500 }),
    getBackofficeSupportRepository().list({ pageSize: 100 }),
  ]);

  const journeys = journeysPage.items.length ? journeysPage.items : store.journeys;
  const errors = errorsPage.items.length ? errorsPage.items : store.errors;
  const broken = detectBrokenJourneyPatterns(journeys);

  const enterprises = await getBackofficeEnterpriseGovernanceRepository().listEnterprises();
  const ents = enterprises.length ? enterprises : store.enterprises;

  return {
    activeUsers: store.users.filter((u) => u.sessionActive).length,
    registrationsInProgress: journeys.filter(
      (j) => j.journeyKey === "terrain_onboarding" && j.status === "IN_PROGRESS",
    ).length,
    blockedJourneys: journeys.filter((j) => j.status === "BLOCKED" || j.status === "FAILED").length,
    recentErrors: errors.length,
    enterprisesToValidate: ents.filter((e) => e.channelStatus === "pending").length,
    suspendedAccounts: store.users.filter((u) => u.securityStatus === "suspended").length,
    securityAlerts: ents.reduce((n, e) => n + e.securityAlerts, 0),
    platformHealth: store.health?.components ?? defaultHealth().components,
    probableSupportQueue: supportPage.items.filter((t) => t.status === "OPEN").length,
    brokenPatterns: broken.length,
  };
}

export function defaultHealth(): PlatformHealthSnapshot {
  return {
    checkedAt: new Date().toISOString(),
    components: {
      bff: { status: "healthy", latencyMs: 42 },
      core: { status: "healthy", latencyMs: 88 },
      database: { status: "healthy", latencyMs: 12 },
      auth: { status: "healthy" },
      wallet_security: { status: "healthy" },
      messaging: { status: "healthy" },
      notifications: { status: "healthy" },
      offline_sync: { status: "degraded", fallbackRate: 0.04, message: "Sync partiel" },
      governance_sync: { status: "healthy", latencyMs: 120 },
    },
  };
}

export async function productQualitySummary() {
  const [errorsPage, journeysPage] = await Promise.all([
    getBackofficeErrorRepository().list({ pageSize: 500 }),
    getBackofficeJourneyRepository().list({ pageSize: 500 }),
  ]);
  const store = getBackofficeStore();
  const errors = errorsPage.items.length ? errorsPage.items : store.errors;
  const journeys = journeysPage.items.length ? journeysPage.items : store.journeys;

  const engine = getBackofficeProductHealthEngine();
  const report = engine.compute(errors, journeys);

  const byType = new Map<string, number>();
  for (const e of errors) {
    byType.set(e.errorType, (byType.get(e.errorType) ?? 0) + 1);
  }
  const topErrors = [...byType.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([errorType, count]) => ({ errorType, count }));

  const broken = detectBrokenJourneyPatterns(journeys);
  const brokenJourneys = [...new Set(broken.map((b) => b.journeyKey))].map((journeyKey) => ({
    journeyKey,
    count: broken.filter((b) => b.journeyKey === journeyKey).length,
  }));

  const day = Date.now() - 24 * 3600_000;
  const recentJourneys = journeys.filter((j) => new Date(j.lastStepAt).getTime() > day);
  const abandonRate =
    recentJourneys.length === 0
      ? 0
      : Math.round(
          (recentJourneys.filter((j) => j.status === "ABANDONED").length / recentJourneys.length) * 100,
        );

  const apps = [
    "mobile-grossiste-b",
    "mobile-detaillant",
    "web-grossiste-a",
    "web-industrial-nextjs",
    "backoffice-web",
  ] as const;
  const appStability = apps.map((application) => {
    const appErrors = errors.filter(
      (e) => e.application === application && new Date(e.occurredAt).getTime() > day,
    );
    const blocked = recentJourneys.filter(
      (j) =>
        j.application === application &&
        (j.status === "BLOCKED" || j.status === "FAILED" || j.status === "ABANDONED"),
    ).length;
    const score = Math.max(0, 100 - appErrors.length * 2 - blocked * 5);
    return { application, errorCount24h: appErrors.length, blockedJourneys24h: blocked, stabilityScore: score };
  });

  const moduleHeatmap = report.unstableModules.slice(0, 12);
  const blockedJourneyRate =
    recentJourneys.length === 0
      ? 0
      : Math.round(
          (recentJourneys.filter((j) => j.status === "BLOCKED" || j.status === "FAILED").length /
            recentJourneys.length) *
            100,
        );

  return {
    topErrors,
    brokenJourneys,
    journeySuccessRate: report.journeySuccessRate,
    abandonRate,
    blockedJourneyRate,
    moduleHeatmap,
    appStability,
    liveErrorsCount: errors.filter((e) => new Date(e.occurredAt).getTime() > day).length,
    liveJourneysActive: recentJourneys.filter((j) => j.status === "IN_PROGRESS" || j.status === "STARTED")
      .length,
    onboardingIncomplete: recentJourneys.filter(
      (j) => j.journeyKey === "terrain_onboarding" && j.status !== "COMPLETED",
    ).length,
    enterpriseActivationPending: journeys.filter(
      (j) => j.journeyKey === "enterprise_invitation" && j.status === "IN_PROGRESS",
    ).length,
    actionableHints: report.actionableHints,
    report,
  };
}

export function listUsersForBackoffice(revealSensitive = false) {
  return getBackofficeStore().users.map((u) => ({
    ...u,
    phone: maskPhone(u.phone, revealSensitive),
    email: maskEmail(u.email, revealSensitive),
  }));
}

export async function globalSearch(q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  const store = getBackofficeStore();
  const results: { kind: string; id: string; label: string; subtitle?: string; href: string }[] = [];

  for (const u of store.users) {
    if (
      u.fullName.toLowerCase().includes(query) ||
      u.phone.includes(query) ||
      (u.email?.toLowerCase().includes(query) ?? false)
    ) {
      results.push({
        kind: "user",
        id: u.id,
        label: u.fullName,
        subtitle: maskPhone(u.phone),
        href: `/pilotage/users/${u.id}`,
      });
    }
  }

  const enterprises = await getBackofficeEnterpriseGovernanceRepository().listEnterprises();
  for (const e of enterprises.length ? enterprises : store.enterprises) {
    if (e.name.toLowerCase().includes(query) || e.id.toLowerCase().includes(query)) {
      results.push({
        kind: "enterprise",
        id: e.id,
        label: e.name,
        href: `/pilotage/enterprises/${e.id}`,
      });
    }
  }

  const errors = await getBackofficeErrorRepository().list({ pageSize: 50 });
  for (const err of errors.items) {
    if (err.id.includes(query) || err.errorType.includes(query) || err.userFacingMessage.toLowerCase().includes(query)) {
      results.push({
        kind: "error",
        id: err.id,
        label: err.errorType,
        subtitle: err.userFacingMessage.slice(0, 80),
        href: `/pilotage/errors/${err.id}`,
      });
    }
  }

  const journeys = await getBackofficeJourneyRepository().list({ pageSize: 50 });
  for (const j of journeys.items) {
    if (j.journeyKey.includes(query) || j.journeyId.includes(query)) {
      results.push({
        kind: "journey",
        id: j.journeyId,
        label: j.journeyKey,
        subtitle: j.status,
        href: `/pilotage/journeys/${j.journeyId}`,
      });
    }
  }

  const support = await getBackofficeSupportRepository().list({ pageSize: 30 });
  for (const t of support.items) {
    if (t.title.toLowerCase().includes(query)) {
      results.push({
        kind: "support",
        id: t.id,
        label: t.title,
        href: `/pilotage/support/${t.id}`,
      });
    }
  }

  const audit = await getBackofficeAuditRepository().list({ pageSize: 30 });
  for (const a of audit.items) {
    if (a.action.includes(query) || a.targetId.includes(query)) {
      results.push({
        kind: "audit",
        id: a.id,
        label: a.action,
        subtitle: a.actorEmail,
        href: `/pilotage/audit`,
      });
    }
  }

  const notifications = await getBackofficeInternalNotificationRepository().list({ pageSize: 20 });
  for (const n of notifications.items) {
    if (n.title.toLowerCase().includes(query)) {
      results.push({
        kind: "notification",
        id: n.id,
        label: n.title,
        href: `/pilotage`,
      });
    }
  }

  return results.slice(0, 30);
}

export async function getUserOperationalProfile(userId: string) {
  const user = getBackofficeStore().users.find((u) => u.id === userId);
  if (!user) return null;

  const errors = (await getBackofficeErrorRepository().list({ pageSize: 100 })).items.filter(
    (e) => e.userId === userId,
  );
  const journeys = (await getBackofficeJourneyRepository().list({ pageSize: 100 })).items.filter(
    (j) => j.userId === userId,
  );
  const support = (await getBackofficeSupportRepository().list({ pageSize: 50 })).items.filter(
    (t) => t.userId === userId,
  );

  return {
    user: listUsersForBackoffice(false).find((u) => u.id === userId),
    errors,
    journeys,
    support,
    incompleteActions: journeys.filter((j) => j.status !== "COMPLETED"),
    failedAttempts: errors.filter((e) => e.severity === "critical" || e.errorType === "otp_invalid"),
  };
}

export async function getEnterpriseOperationalProfile(enterpriseId: string) {
  const { fetchEnterpriseGovernanceLiveSnapshot } = await import(
    "../governance/enterprise-governance-live-client.js"
  );
  const { governanceResponseMeta } = await import("../governance/enterprise-governance-envelope.js");

  const snapshot = await fetchEnterpriseGovernanceLiveSnapshot();
  const liveChannel = snapshot.channels.find((c) => c.enterpriseId === enterpriseId);

  const ent =
    (await getBackofficeEnterpriseGovernanceRepository().getEnterprise(enterpriseId)) ??
    (liveChannel
      ? {
          id: liveChannel.enterpriseId,
          name: liveChannel.companyName,
          channelStatus: getBackofficeEnterpriseGovernanceRepository().channelStatusFromGovernance(
            liveChannel.governanceStatus,
          ),
          contractRef: liveChannel.contractReference,
          polesActivated: snapshot.polesByEnterprise.get(enterpriseId) ?? [],
          activeCollaborators: 0,
          suspendedUsers:
            liveChannel.activationStatus === "SUSPENDED" || liveChannel.activationStatus === "ARCHIVED" ? 1 : 0,
          pendingInvitations: 0,
          securityAlerts: (snapshot.alertsByEnterprise.get(enterpriseId) ?? []).filter((a) => !a.acknowledged)
            .length,
        }
      : null);

  if (!ent) return null;

  const timeline = await getBackofficeEnterpriseGovernanceRepository().listGovernanceEvents(enterpriseId, {
    pageSize: 100,
  });

  const governanceTimeline =
    timeline.items.length > 0
      ? timeline.items
      : snapshot.history
          .filter((h) => h.enterpriseId === enterpriseId)
          .map((h, idx) => ({
            id: `live-h-${idx}`,
            enterpriseId,
            eventKind: h.action.toLowerCase(),
            title: h.action,
            detail: h.note,
            author: h.author,
            previousState: h.previousState,
            newState: h.newState,
            createdAt: h.createdAt ?? new Date().toISOString(),
          }));

  return {
    enterprise: ent,
    governanceTimeline,
    securityAlerts: snapshot.alertsByEnterprise.get(enterpriseId) ?? [],
    poles: snapshot.polesByEnterprise.get(enterpriseId) ?? [],
    invitations: [],
    collaborators: [],
    meta: governanceResponseMeta(snapshot),
  };
}
