import type { BackofficeAppObservability } from "../types/platform.types.js";
import { getBackofficeStore } from "../store/backoffice-store.js";
import { resolveBackofficePersistenceMode } from "../persistence/persistence-mode.js";
import { getBackofficePrisma, toPrismaJson } from "../persistence/prisma.js";

export class BackofficeObservabilityRepository {
  async recordAppSnapshot(snapshot: BackofficeAppObservability & { build?: string; avgLatencyMs?: number; fallbackRate?: number }): Promise<void> {
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") return;

    try {
      await getBackofficePrisma().backofficeAppObservabilityRecord.create({
        data: {
          application: snapshot.application,
          version: snapshot.version,
          build: snapshot.build,
          activeSessions: snapshot.activeUsers,
          errorCount24h: snapshot.errorCount24h,
          blockedJourneys24h: snapshot.blockedJourneys24h,
          avgLatencyMs: snapshot.avgLatencyMs,
          fallbackRate: snapshot.fallbackRate,
        },
      });
    } catch {
      /* HYBRID: ignore */
    }
  }

  private liveCountsForApp(application: string, store: ReturnType<typeof getBackofficeStore>) {
    const day = Date.now() - 24 * 3600_000;
    return {
      errorCount24h: store.errors.filter(
        (e) => e.application === application && new Date(e.occurredAt).getTime() > day,
      ).length,
      blockedJourneys24h: store.journeys.filter(
        (j) =>
          j.application === application &&
          (j.status === "BLOCKED" || j.status === "FAILED" || j.status === "ABANDONED") &&
          new Date(j.lastStepAt).getTime() > day,
      ).length,
      activeUsers: store.users.filter((u) => u.sessionActive).length,
    };
  }

  async listLatestByApp(): Promise<BackofficeAppObservability[]> {
    const apps = [
      "mobile-grossiste-b",
      "mobile-detaillant",
      "web-grossiste-a",
      "web-industrial-nextjs",
      "backoffice-web",
    ] as const;

    const store = getBackofficeStore();
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") {
      return apps.map((application) => {
        const live = this.liveCountsForApp(application, store);
        return {
          application,
          activeUsers: live.activeUsers,
          errorCount24h: live.errorCount24h,
          blockedJourneys24h: live.blockedJourneys24h,
          version: "1.0.0-demo",
        };
      });
    }

    try {
      const prisma = getBackofficePrisma();
      const results: BackofficeAppObservability[] = [];
      for (const application of apps) {
        const row = await prisma.backofficeAppObservabilityRecord.findFirst({
          where: { application, archivedAt: null },
          orderBy: { snapshotAt: "desc" },
        });
        if (row) {
          results.push({
            application: row.application as BackofficeAppObservability["application"],
            activeUsers: row.activeSessions,
            errorCount24h: row.errorCount24h,
            blockedJourneys24h: row.blockedJourneys24h,
            version: row.version ?? undefined,
          });
        } else {
          const live = this.liveCountsForApp(application, store);
          results.push({
            application,
            activeUsers: live.activeUsers,
            errorCount24h: live.errorCount24h,
            blockedJourneys24h: live.blockedJourneys24h,
          });
        }
      }
      return results.map((row) => {
        const live = this.liveCountsForApp(row.application, store);
        return {
          ...row,
          errorCount24h: Math.max(row.errorCount24h, live.errorCount24h),
          blockedJourneys24h: Math.max(row.blockedJourneys24h, live.blockedJourneys24h),
        };
      });
    } catch {
      return apps.map((application) => {
        const live = this.liveCountsForApp(application, store);
        return {
          application,
          activeUsers: live.activeUsers,
          errorCount24h: live.errorCount24h,
          blockedJourneys24h: live.blockedJourneys24h,
        };
      });
    }
  }

  async recordPlatformEvent(input: {
    eventType: string;
    component: string;
    severity: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") return;
    try {
      await getBackofficePrisma().backofficePlatformEventRecord.create({
        data: {
          eventType: input.eventType,
          component: input.component,
          severity: input.severity,
          message: input.message,
          metadata: toPrismaJson(input.metadata),
        },
      });
    } catch {
      /* ignore */
    }
  }
}

let singleton: BackofficeObservabilityRepository | null = null;
export function getBackofficeObservabilityRepository(): BackofficeObservabilityRepository {
  if (!singleton) singleton = new BackofficeObservabilityRepository();
  return singleton;
}
