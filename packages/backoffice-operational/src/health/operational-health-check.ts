import { resolveBackofficePersistenceMode, hasDatabaseUrl } from "../persistence/persistence-mode.js";
import { getBackofficePrisma } from "../persistence/prisma.js";
import { getBackofficeStore } from "../store/backoffice-store.js";
import type { PlatformHealthSnapshot } from "../types/platform.types.js";
import { runCommerceOperationalHealthProbes } from "./operational-health-probes.js";
import { resolveOperationalPersistenceMode } from "../persistence/operational-persistence-mode.js";
import { toPrismaJson } from "../persistence/prisma.js";

export type HealthProbe = {
  component: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  latencyMs?: number;
  message?: string;
};

async function probe(label: string, fn: () => Promise<void>): Promise<HealthProbe> {
  const start = Date.now();
  try {
    await fn();
    return { component: label, status: "healthy", latencyMs: Date.now() - start };
  } catch (e) {
    return {
      component: label,
      status: "down",
      latencyMs: Date.now() - start,
      message: e instanceof Error ? e.message : "probe_failed",
    };
  }
}

export async function runBackofficeOperationalHealthCheck(input: {
  bffOk?: boolean;
  coreOk?: boolean;
  messagingOk?: boolean;
  walletOk?: boolean;
  notificationsOk?: boolean;
  governanceSyncOk?: boolean;
} = {}): Promise<PlatformHealthSnapshot> {
  const mode = resolveBackofficePersistenceMode();
  const store = getBackofficeStore();

  const components: PlatformHealthSnapshot["components"] = {
    auth: { status: "unknown" },
    bff: { status: input.bffOk === false ? "down" : "healthy", latencyMs: 40 },
    core: { status: input.coreOk === false ? "down" : input.coreOk ? "healthy" : "degraded", latencyMs: 90 },
    database: { status: "unknown" },
    messaging: {
      status: input.messagingOk === false ? "down" : input.messagingOk ? "healthy" : "degraded",
      message: input.messagingOk === false ? "Messaging probe failed" : undefined,
    },
    wallet_security: {
      status: input.walletOk === false ? "down" : input.walletOk ? "healthy" : "degraded",
    },
    notifications: {
      status: input.notificationsOk === false ? "down" : input.notificationsOk ? "healthy" : "degraded",
    },
    offline_sync: { status: "degraded", fallbackRate: mode === "FALLBACK" ? 1 : 0.04 },
    governance_sync: {
      status: input.governanceSyncOk === false ? "down" : input.governanceSyncOk ? "healthy" : "degraded",
    },
  };

  const authProbe = await probe("auth", async () => {
    const resolution = resolveOperationalPersistenceMode();
    if (resolution.mode === "LIVE" && hasDatabaseUrl()) {
      const sessions = await getBackofficePrisma().backofficeOperatorSession.count({
        where: { expiresAt: { gt: new Date() } },
      });
      if (sessions === 0) throw new Error("no_live_auth_sessions");
      return;
    }
    if (!store.sessions.size && !hasDatabaseUrl()) throw new Error("no_auth_sessions");
  });
  components.auth = {
    status: authProbe.status === "healthy" ? "healthy" : "degraded",
    latencyMs: authProbe.latencyMs,
    message: authProbe.message,
  };

  const otpProbe = await probe("otp", async () => {
    if (!hasDatabaseUrl()) return;
    const recent = await getBackofficePrisma().backofficeAuthAttempt.count({
      where: {
        kind: "otp_verify",
        success: false,
        createdAt: { gt: new Date(Date.now() - 3600_000) },
      },
    });
    if (recent >= 20) throw new Error("otp_failure_spike");
  });
  if (otpProbe.status !== "healthy") {
    components.auth = {
      status: "degraded",
      message: otpProbe.message ?? "OTP sous pression",
      latencyMs: otpProbe.latencyMs,
    };
  }

  if (mode !== "FALLBACK" && hasDatabaseUrl()) {
    const dbProbe = await probe("database", async () => {
      await getBackofficePrisma().$queryRaw`SELECT 1`;
    });
    components.database = {
      status: dbProbe.status === "healthy" ? "healthy" : "down",
      latencyMs: dbProbe.latencyMs,
      message: dbProbe.message,
    };
  } else {
    components.database = { status: "degraded", message: "FALLBACK mode — Prisma inactive" };
  }

  if (input.bffOk === false) {
    components.bff = { status: "down", message: "BFF unreachable" };
  }
  if (input.coreOk === false) {
    components.core = { status: "down", message: "Core domain unreachable" };
  }

  const liveProbes = runCommerceOperationalHealthProbes();

  if (!liveProbes.auth.ok) {
    components.auth = { status: "degraded", message: liveProbes.auth.message };
  }
  if (!liveProbes.wallet.ok) {
    components.wallet_security = {
      status: input.walletOk === false ? "down" : "degraded",
      message: liveProbes.wallet.message,
    };
  }
  if (!liveProbes.messaging.ok) {
    components.messaging = {
      status: input.messagingOk === false ? "down" : "degraded",
      message: liveProbes.messaging.message,
    };
  }
  if (!liveProbes.notifications.ok) {
    components.notifications = {
      status: input.notificationsOk === false ? "down" : "degraded",
      message: liveProbes.notifications.message,
    };
  }
  if (!liveProbes.catalogue.ok || !liveProbes.upload.ok) {
    components.core = {
      status: input.coreOk === false ? "down" : "degraded",
      message: liveProbes.catalogue.message ?? liveProbes.upload.message,
    };
  }
  if (!liveProbes.offline_sync.ok) {
    components.offline_sync = {
      status: "degraded",
      fallbackRate: mode === "FALLBACK" ? 1 : 0.08,
      message: liveProbes.offline_sync.message,
    };
  } else if (mode !== "FALLBACK") {
    components.offline_sync = { status: "healthy", fallbackRate: 0.02 };
  }

  const snapshot = { checkedAt: new Date().toISOString(), components };
  await persistHealthSnapshot(snapshot);
  return snapshot;
}

export async function persistHealthSnapshot(snapshot: PlatformHealthSnapshot): Promise<void> {
  const mode = resolveBackofficePersistenceMode();
  if (mode === "FALLBACK") return;
  try {
    await getBackofficePrisma().backofficeHealthSnapshotRecord.create({
      data: { components: toPrismaJson(snapshot.components) },
    });
  } catch {
    /* non bloquant */
  }
}
