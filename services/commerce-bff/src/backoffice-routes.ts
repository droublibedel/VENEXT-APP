import type { Express, Request, Response } from "express";
import {
  wireCommerceHumanizedErrorsToBackoffice,
  applySensitiveEnterpriseAction,
  applySensitiveUserAction,
  buildDashboardReadout,
  getBackofficeStore,
  globalSearch,
  listUsersForBackoffice,
  logoutBackofficeSession,
  patchBackofficeFlag,
  productQualitySummary,
  requestBackofficeCode,
  resolveBackofficeSession,
  seedOperationalDemoData,
  verifyBackofficeCode,
  getBackofficeErrorRepository,
  getBackofficeJourneyRepository,
  getBackofficeSupportRepository,
  getBackofficeAuditRepository,
  getBackofficeObservabilityRepository,
  getBackofficeEnterpriseGovernanceRepository,
  getBackofficeInternalNotificationRepository,
  runBackofficeOperationalHealthCheck,
  syncEnterpriseGovernanceToBackoffice,
  loadEnterpriseGovernanceContext,
  governanceResponseMeta,
  defaultGovernanceMeta,
  lightweightListEnvelope,
  envelopeFromArray,
  normalizeBackofficeEnvelope,
  paginate,
  resolveBackofficePersistenceMode,
  resolveOperationalPersistenceMode,
  envelopeWithOperationalMeta,
  attachOperationalMeta,
  BackofficeOperationalEventStream,
  evaluateAutomaticAlerts,
  getUserOperationalProfile,
  getEnterpriseOperationalProfile,
  auditFeatureFlagExposure,
  immutableBackofficeAuditTrail,
} from "backoffice-operational";

import { fetchCore, persistenceEnabled } from "./core-client.js";

function sessionToken(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  const cookie = req.headers["x-venext-backoffice-session"];
  return typeof cookie === "string" ? cookie : undefined;
}

async function requireSession(
  req: Request,
  res: Response,
): Promise<Awaited<ReturnType<typeof resolveBackofficeSession>>> {
  const session = await resolveBackofficeSession(sessionToken(req));
  if (!session) {
    res.status(401).json({ code: "backoffice_session_required" });
    return null;
  }
  return session;
}

function actorFromSession(
  session: NonNullable<Awaited<ReturnType<typeof resolveBackofficeSession>>>,
) {
  return { email: session.email, id: session.operatorId };
}

function pageFromQuery(req: Request): { page: number; pageSize: number } {
  return {
    page: Math.max(1, Number(req.query.page ?? 1)),
    pageSize: Math.min(200, Math.max(1, Number(req.query.pageSize ?? 50))),
  };
}

export function registerBackofficeRoutes(app: Express) {
  wireCommerceHumanizedErrorsToBackoffice();
  void seedOperationalDemoData().then(() => syncEnterpriseGovernanceToBackoffice());

  app.post("/api/backoffice/auth/request-code", async (req, res) => {
    const email = String(req.body?.email ?? "");
    const result = await requestBackofficeCode(email);
    if (!result.ok) {
      res.status(403).json(result);
      return;
    }
    res.json(attachOperationalMeta({ ok: true, devCode: "devCode" in result ? result.devCode : undefined }));
  });

  app.post("/api/backoffice/auth/verify-code", async (req, res) => {
    const email = String(req.body?.email ?? "");
    const code = String(req.body?.code ?? "");
    const result = await verifyBackofficeCode(email, code);
    if (!result.ok) {
      res.status(401).json(result);
      return;
    }
    res.json(
      attachOperationalMeta({
        ok: true,
        token: result.session.token,
        expiresAt: result.session.expiresAt,
      }),
    );
  });

  app.post("/api/backoffice/auth/logout", async (req, res) => {
    await logoutBackofficeSession(sessionToken(req));
    res.json(attachOperationalMeta({ ok: true }));
  });

  app.get("/api/backoffice/dashboard", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const dash = await buildDashboardReadout();
    res.json(attachOperationalMeta(dash));
  });

  app.get("/api/backoffice/errors", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const { page, pageSize } = pageFromQuery(req);
    const status = req.query.status ? String(req.query.status) : undefined;
    const result = await getBackofficeErrorRepository().list({ status, page, pageSize });
    res.json(
      envelopeWithOperationalMeta(
        lightweightListEnvelope(result, resolveBackofficePersistenceMode() === "FALLBACK" ? "fallback" : "live"),
      ),
    );
  });

  app.get("/api/backoffice/errors/:id", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const row = await getBackofficeErrorRepository().getById(req.params.id);
    if (!row) {
      res.status(404).json({ code: "not_found" });
      return;
    }
    res.json(row);
  });

  app.patch("/api/backoffice/errors/:id/status", async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;
    const row = await getBackofficeErrorRepository().updateStatus(
      req.params.id,
      req.body?.status,
      req.body?.note,
    );
    if (!row) {
      res.status(404).json({ code: "not_found" });
      return;
    }
    await immutableBackofficeAuditTrail({
      actorEmail: session.email,
      actorId: session.operatorId,
      action: "error_status_patch",
      targetType: "error",
      targetId: row.id,
      note: req.body?.note,
    });
    res.json(row);
  });

  app.get("/api/backoffice/journeys", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const { page, pageSize } = pageFromQuery(req);
    const status = req.query.status ? String(req.query.status) : undefined;
    const result = await getBackofficeJourneyRepository().list({ status, page, pageSize });
    res.json(envelopeWithOperationalMeta(lightweightListEnvelope(result, "live")));
  });

  app.get("/api/backoffice/journeys/:id", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const row = await getBackofficeJourneyRepository().getById(req.params.id);
    if (!row) {
      res.status(404).json({ code: "not_found" });
      return;
    }
    res.json(row);
  });

  app.get("/api/backoffice/users", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const reveal = req.query.reveal === "true";
    const { page, pageSize } = pageFromQuery(req);
    const users = listUsersForBackoffice(reveal);
    res.json(
      envelopeWithOperationalMeta(
        lightweightListEnvelope(
          paginate(users, page, pageSize),
          resolveBackofficePersistenceMode() === "FALLBACK" ? "fallback" : "live",
        ),
      ),
    );
  });

  app.get("/api/backoffice/users/:id", async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;
    const profile = await getUserOperationalProfile(req.params.id);
    if (!profile) {
      res.status(404).json({ code: "not_found" });
      return;
    }
    await immutableBackofficeAuditTrail({
      actorEmail: session.email,
      actorId: session.operatorId,
      action: "view_sensitive_user",
      targetType: "user",
      targetId: req.params.id,
    });
    res.json(profile);
  });

  app.get("/api/backoffice/enterprises", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const snapshot = await loadEnterpriseGovernanceContext();
    await syncEnterpriseGovernanceToBackoffice();
    const items = snapshot.channels.map((ch) => ({
      id: ch.enterpriseId,
      name: ch.companyName,
      channelStatus: getBackofficeEnterpriseGovernanceRepository().channelStatusFromGovernance(
        ch.governanceStatus,
      ),
      contractRef: ch.contractReference,
      polesActivated: snapshot.polesByEnterprise.get(ch.enterpriseId) ?? [],
      securityAlerts: (snapshot.alertsByEnterprise.get(ch.enterpriseId) ?? []).filter((a) => !a.acknowledged)
        .length,
    }));
    res.json(
      normalizeBackofficeEnvelope(
        { payload: items, ...governanceResponseMeta(snapshot) },
        { persistenceMode: resolveBackofficePersistenceMode() },
      ),
    );
  });

  app.get("/api/backoffice/enterprises/:id", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const profile = await getEnterpriseOperationalProfile(req.params.id);
    if (!profile) {
      res.status(404).json({ code: "not_found" });
      return;
    }
    res.json({
      ...profile,
      persistenceMode: resolveBackofficePersistenceMode(),
    });
  });

  app.get("/api/backoffice/enterprises/:id/timeline", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const id = req.params.id;
    const snapshot = await loadEnterpriseGovernanceContext();
    const core = await fetchCore<{ payload: unknown[] } & Record<string, unknown>>(
      `/commerce-foundation/enterprise/channels/${id}/timeline`,
    );
    const payload = core.ok && core.data?.payload ? core.data.payload : snapshot.history.filter((h) => h.enterpriseId === id);
    res.json({
      items: payload,
      ...(core.data && typeof core.data.dataSource === "string"
        ? {
            dataSource: core.data.dataSource,
            persistenceMode: core.data.persistenceMode ?? resolveBackofficePersistenceMode(),
            fallbackUsed: Boolean(core.data.fallbackUsed),
          }
        : governanceResponseMeta(snapshot)),
    });
  });

  app.get("/api/backoffice/enterprises/:id/poles", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const id = req.params.id;
    const core = await fetchCore<{ payload: unknown[] }>(`/commerce-foundation/enterprise/channels/${id}/poles`);
    const snapshot = await loadEnterpriseGovernanceContext();
    res.json({
      items: core.ok && core.data?.payload ? core.data.payload : snapshot.polesByEnterprise.get(id) ?? [],
      ...defaultGovernanceMeta(),
      ...(core.data ? { dataSource: "LIVE" as const, fallbackUsed: false } : governanceResponseMeta(snapshot)),
    });
  });

  app.get("/api/backoffice/enterprises/:id/invitations", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const id = req.params.id;
    const core = await fetchCore<{ payload: unknown[] }>(`/commerce-foundation/enterprise/channels/${id}/invitations`);
    res.json({
      items: core.ok && core.data?.payload ? core.data.payload : [],
      ...defaultGovernanceMeta(),
      dataSource: core.ok ? "LIVE" : "FALLBACK",
      fallbackUsed: !core.ok,
    });
  });

  app.get("/api/backoffice/enterprises/:id/collaborators", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const id = req.params.id;
    const core = await fetchCore<{ payload: unknown[] }>(
      `/commerce-foundation/enterprise/channels/${id}/collaborators`,
    );
    res.json({
      items: core.ok && core.data?.payload ? core.data.payload : [],
      ...defaultGovernanceMeta(),
      dataSource: core.ok ? "LIVE" : "FALLBACK",
      fallbackUsed: !core.ok,
    });
  });

  app.get("/api/backoffice/enterprises/:id/security-alerts", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const id = req.params.id;
    const snapshot = await loadEnterpriseGovernanceContext();
    const core = await fetchCore<{ payload: unknown[] }>(
      `/commerce-foundation/enterprise/channels/${id}/security-alerts`,
    );
    res.json({
      items:
        core.ok && core.data?.payload
          ? core.data.payload
          : snapshot.alertsByEnterprise.get(id) ?? [],
      ...(core.ok ? { dataSource: "LIVE" as const, fallbackUsed: false } : governanceResponseMeta(snapshot)),
      persistenceMode: resolveBackofficePersistenceMode(),
    });
  });

  app.patch("/api/backoffice/enterprises/:id/status", async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;
    const id = req.params.id;
    const action = String(req.body?.action ?? "");
    const note = String(req.body?.note ?? "");

    if (persistenceEnabled()) {
      const mapAction =
        action === "enterprise_archive" ? "archive" : action === "enterprise_reactivate" ? "reactivate" : null;
      if (mapAction) {
        const core = await fetchCore(`/commerce-foundation/enterprise/channels/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ action: mapAction, note }),
        });
        if (core.ok) {
          await immutableBackofficeAuditTrail({
            actorEmail: session.email,
            actorId: session.operatorId,
            action: `enterprise_${mapAction}`,
            targetType: "enterprise",
            targetId: id,
            note,
          });
          await syncEnterpriseGovernanceToBackoffice();
          const profile = await getEnterpriseOperationalProfile(id);
          return res.json({ ...profile, dataSource: "LIVE", fallbackUsed: false });
        }
      }
    }

    const result = await applySensitiveEnterpriseAction(
      id,
      action as "enterprise_suspend" | "enterprise_reactivate" | "enterprise_archive",
      actorFromSession(session),
      note,
    );
    if (!result.ok) {
      res.status(400).json(result);
      return;
    }
    res.json({
      enterprise: await getBackofficeEnterpriseGovernanceRepository().getEnterprise(id),
      ...defaultGovernanceMeta(),
    });
  });

  app.get("/api/backoffice/support", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const { page, pageSize } = pageFromQuery(req);
    const result = await getBackofficeSupportRepository().list({ page, pageSize });
    res.json(envelopeWithOperationalMeta(lightweightListEnvelope(result, "live")));
  });

  app.post("/api/backoffice/support", async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;
    const ticket = await getBackofficeSupportRepository().create({
      priority: req.body?.priority ?? "NORMAL",
      source: "MANUAL",
      status: "OPEN",
      title: String(req.body?.title ?? "Demande support"),
      summary: String(req.body?.summary ?? ""),
      userId: req.body?.userId,
    });
    res.status(201).json(ticket);
  });

  app.get("/api/backoffice/health", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    let coreOk = false;
    let messagingOk = true;
    let walletOk = true;
    let notificationsOk = true;
    let governanceSyncOk = true;
    const bffOk = true;
    if (persistenceEnabled()) {
      const [coreHealth, msgHealth, walletHealth, notifHealth] = await Promise.all([
        fetchCore<{ ok?: boolean }>("/health"),
        fetchCore<{ ok?: boolean }>("/health").catch(() => ({ ok: false })),
        fetchCore<{ ok?: boolean }>("/health").catch(() => ({ ok: false })),
        fetchCore<{ ok?: boolean }>("/health").catch(() => ({ ok: false })),
      ]);
      coreOk = coreHealth.ok;
      messagingOk = msgHealth.ok;
      walletOk = walletHealth.ok;
      notificationsOk = notifHealth.ok;
      try {
        await syncEnterpriseGovernanceToBackoffice();
        governanceSyncOk = true;
      } catch {
        governanceSyncOk = false;
      }
    }
    const health = await runBackofficeOperationalHealthCheck({
      bffOk,
      coreOk,
      messagingOk,
      walletOk,
      notificationsOk,
      governanceSyncOk,
    });
    getBackofficeStore().health = health;
    res.json(attachOperationalMeta(health));
  });

  app.get("/api/backoffice/audit-log", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const { page, pageSize } = pageFromQuery(req);
    const result = await getBackofficeAuditRepository().list({ page, pageSize });
    res.json(envelopeWithOperationalMeta(lightweightListEnvelope(result, "live")));
  });

  app.get("/api/backoffice/feature-flags", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const flags = getBackofficeStore().flags;
    const audit = auditFeatureFlagExposure(flags);
    res.json({
      ...normalizeBackofficeEnvelope(
        { payload: flags },
        { dataSource: "LIVE", persistenceMode: resolveBackofficePersistenceMode() },
      ),
      audit,
    });
  });

  app.patch("/api/backoffice/feature-flags/:key", async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;
    try {
      const row = await patchBackofficeFlag(
        req.params.key,
        Boolean(req.body?.enabled),
        actorFromSession(session),
        String(req.body?.note ?? ""),
      );
      if (!row) {
        res.status(404).json({ code: "not_found" });
        return;
      }
      res.json(row);
    } catch (e) {
      res.status(400).json({ code: (e as Error).message });
    }
  });

  app.get("/api/backoffice/search", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const results = await globalSearch(String(req.query.q ?? ""));
    res.json(
      envelopeWithOperationalMeta(
        envelopeFromArray(results, resolveBackofficePersistenceMode() === "FALLBACK" ? "FALLBACK" : "LIVE"),
      ),
    );
  });

  app.get("/api/backoffice/support/:id", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const row = await getBackofficeSupportRepository().getById(req.params.id);
    if (!row) {
      res.status(404).json({ code: "not_found" });
      return;
    }
    res.json(row);
  });

  app.patch("/api/backoffice/support/:id", async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;
    const row = await getBackofficeSupportRepository().patch(req.params.id, {
      status: req.body?.status,
      priority: req.body?.priority,
      note: req.body?.note,
      assignee: req.body?.assignee,
    });
    if (!row) {
      res.status(404).json({ code: "not_found" });
      return;
    }
    await immutableBackofficeAuditTrail({
      actorEmail: session.email,
      actorId: session.operatorId,
      action: "support_ticket_patch",
      targetType: "support",
      targetId: row.id,
      note: req.body?.note,
    });
    res.json(row);
  });

  app.get("/api/backoffice/product-quality", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    res.json(attachOperationalMeta(await productQualitySummary()));
  });

  app.get("/api/backoffice/documents", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    res.json(
      envelopeWithOperationalMeta(
        envelopeFromArray(getBackofficeStore().documents, "LIVE"),
        resolveBackofficePersistenceMode() === "FALLBACK",
      ),
    );
  });

  app.get("/api/backoffice/notifications", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const { page, pageSize } = pageFromQuery(req);
    const result = await getBackofficeInternalNotificationRepository().list({ page, pageSize });
    res.json(envelopeWithOperationalMeta(lightweightListEnvelope(result, "live")));
  });

  app.get("/api/backoffice/event-stream", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const { page, pageSize } = pageFromQuery(req);
    const kind = req.query.kind ? String(req.query.kind) : undefined;
    const items = await BackofficeOperationalEventStream.shared().list({ kind, page, pageSize });
    res.json({ items, pagination: { page, pageSize } });
  });

  app.get("/api/backoffice/alerts/evaluate", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const store = getBackofficeStore();
    const errors = (await getBackofficeErrorRepository().list({ pageSize: 300 })).items;
    const journeys = (await getBackofficeJourneyRepository().list({ pageSize: 300 })).items;
    const alerts = await evaluateAutomaticAlerts({
      errors: errors.length ? errors : store.errors,
      journeys: journeys.length ? journeys : store.journeys,
    });
    res.json({ items: alerts });
  });

  app.post("/api/backoffice/governance/sync", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const r = await syncEnterpriseGovernanceToBackoffice();
    res.json({ ...r, persistenceMode: resolveBackofficePersistenceMode() });
  });

  app.patch("/api/backoffice/users/:id/status", async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;
    const result = await applySensitiveUserAction(
      req.params.id,
      req.body?.action,
      actorFromSession(session),
      String(req.body?.note ?? ""),
    );
    if (!result.ok) {
      res.status(400).json(result);
      return;
    }
    res.json(getBackofficeStore().users.find((u) => u.id === req.params.id));
  });

  app.get("/api/backoffice/app-observability", async (req, res) => {
    if (!(await requireSession(req, res))) return;
    const items = await getBackofficeObservabilityRepository().listLatestByApp();
    res.json(
      envelopeWithOperationalMeta(
        envelopeFromArray(items, resolveBackofficePersistenceMode() === "FALLBACK" ? "FALLBACK" : "LIVE"),
      ),
    );
  });
}
