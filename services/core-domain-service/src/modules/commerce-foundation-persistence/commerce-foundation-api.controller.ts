import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Headers,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import { CommerceFoundationService } from "./commerce-foundation.service";
import { commerceFoundationUxError } from "./commerce-foundation.errors";
import { CommerceFoundationEnvelopeMappers } from "./commerce-foundation-envelope.mappers";
import { DEMO_ORG_PRODUCER } from "./demo/commerce-foundation-demo.seed";
import { CommerceAccessGuardService } from "../commerce-access-guard/commerce-access-guard.service";
import { GrossisteAPoleGuardService } from "../grossiste-a-pole-guard/grossiste-a-pole-guard.service";
import { CommerceActivityFeedPersistenceService } from "./services/commerce-activity-feed-persistence.service";
import { CommerceOfflinePersistenceService } from "./services/commerce-offline-persistence.service";
import { CommerceNotificationPersistenceService } from "./services/commerce-notification-persistence.service";
import { EnterpriseGovernancePersistenceService } from "./services/enterprise-governance-persistence.service";
import { DetaillantRegistrationService } from "./detaillant-registration.service";
import { TerrainSearchService } from "./terrain-search.service";

function envelope<T>(payload: T, dataSource: "live" | "fallback" = "live") {
  return {
    dataSource,
    fallbackUsed: false,
    payload,
  };
}

@Controller("commerce-foundation")
export class CommerceFoundationApiController {
  constructor(
    private readonly foundation: CommerceFoundationService,
    private readonly mappers: CommerceFoundationEnvelopeMappers,
    private readonly notificationPersistence: CommerceNotificationPersistenceService,
    private readonly activityFeedPersistence: CommerceActivityFeedPersistenceService,
    private readonly offlinePersistence: CommerceOfflinePersistenceService,
    private readonly enterpriseGovernance: EnterpriseGovernancePersistenceService,
    private readonly accessGuard: CommerceAccessGuardService,
    private readonly grossisteAPoleGuard: GrossisteAPoleGuardService,
    private readonly detaillantRegistration: DetaillantRegistrationService,
    private readonly terrainSearchService: TerrainSearchService,
  ) {}

  @Post("seed-demo")
  seedDemo() {
    return this.foundation.seedDemoIfEmpty();
  }

  @Post("reset-demo")
  resetDemo() {
    return this.foundation.resetDemo();
  }

  @Get("actors/me")
  async actorMe(@Query("organizationId") organizationId: string, @Query("actorRole") actorRole?: string) {
    if (!organizationId) throw new BadRequestException(commerceFoundationUxError("contextUnavailable"));
    const rows = await this.foundation.list<Record<string, unknown>>("ActorProfile", {
      organizationId,
      actorRole,
      limit: 1,
    });
    if (!rows[0]) throw new NotFoundException(commerceFoundationUxError("relationNotFound"));
    return envelope(rows[0]);
  }

  @Patch("actors/me")
  async patchActorMe(
    @Query("organizationId") organizationId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const existing = await this.foundation.list<Record<string, unknown>>("ActorProfile", {
      organizationId,
      limit: 1,
    });
    const key = (existing[0]?.id as string) ?? `profile-${organizationId}`;
    const next = { ...existing[0], ...body, organizationId, updatedAt: new Date().toISOString() };
    const saved = await this.foundation.upsert("ActorProfile", key, next, { organizationId });
    return envelope(saved);
  }

  @Get("actors/:id")
  async actorById(@Param("id") id: string) {
    const row = await this.foundation.getByKey<Record<string, unknown>>("ActorProfile", id);
    if (!row) throw new NotFoundException(commerceFoundationUxError("relationNotFound"));
    return envelope(row);
  }

  @Get("relationships")
  async relationships(@Query("organizationId") organizationId?: string) {
    const rows = await this.foundation.list<Record<string, unknown>>("CommercialRelationship", {
      organizationId,
      limit: 50,
    });
    const filtered = organizationId
      ? rows.filter(
          (r) => r.actorAId === organizationId || r.actorBId === organizationId,
        )
      : rows;
    return envelope(filtered);
  }

  @Post("relationships")
  async createRelationship(@Body() body: Record<string, unknown>) {
    const id = (body.id as string) ?? `rel-${Date.now()}`;
    const saved = await this.foundation.upsert("CommercialRelationship", id, {
      ...body,
      id,
      createdAt: body.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { relationshipId: id });
    return envelope(saved);
  }

  @Patch("relationships/:id")
  async patchRelationship(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    const existing = await this.foundation.getByKey<Record<string, unknown>>("CommercialRelationship", id);
    if (!existing) throw new NotFoundException(commerceFoundationUxError("relationNotFound"));
    const saved = await this.foundation.upsert(
      "CommercialRelationship",
      id,
      { ...existing, ...body, updatedAt: new Date().toISOString() },
      { relationshipId: id },
    );
    return envelope(saved);
  }

  @Get("relational-catalogs")
  async catalogs(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId?: string,
    @Headers("x-organization-id") viewerOrg?: string,
  ) {
    this.accessGuard.assertCatalogAccess(relationshipId, viewerOrg ?? organizationId);
    const rows = await this.foundation.list<Record<string, unknown>>("RelationalCatalog", {
      organizationId,
      relationshipId,
      limit: 20,
    });
    return envelope(rows);
  }

  @Get("relational-catalogs/:id")
  async catalogById(
    @Param("id") id: string,
    @Headers("x-organization-id") orgHeader?: string,
  ) {
    const catalog = await this.foundation.getByKey<Record<string, unknown>>("RelationalCatalog", id);
    if (!catalog) throw new NotFoundException(commerceFoundationUxError("catalogUnavailable"));
    if (orgHeader) {
      this.foundation.assertCatalogAccess(
        catalog.relationshipId as string,
        orgHeader,
        catalog.relationshipId as string,
      );
    }
    return envelope(catalog);
  }

  @Get("commercial-orders")
  async orders(
    @Query("organizationId") organizationId?: string,
    @Headers("x-organization-id") viewerOrg?: string,
  ) {
    if (organizationId) {
      this.accessGuard.assertOrganizationScope(viewerOrg ?? organizationId, organizationId);
    }
    const rows = await this.foundation.list<Record<string, unknown>>("CommercialOrder", {
      organizationId,
      limit: 50,
    });
    return envelope(rows);
  }

  @Get("commercial-orders/:id")
  async orderById(
    @Param("id") id: string,
    @Query("organizationId") organizationId?: string,
    @Headers("x-organization-id") viewerOrg?: string,
  ) {
    const order = await this.foundation.getByKey<Record<string, unknown>>("CommercialOrder", id);
    if (!order) throw new NotFoundException(commerceFoundationUxError("orderNotAccessible"));
    const viewer = viewerOrg ?? organizationId;
    if (viewer) {
      this.accessGuard.assertOrderParties(
        viewer,
        String(order.buyerActorId ?? order.buyerOrganizationId ?? ""),
        String(order.sellerActorId ?? order.sellerOrganizationId ?? ""),
        order.relationshipId as string | undefined,
      );
    }
    return envelope(order);
  }

  @Patch("commercial-orders/:id/status")
  async patchOrderStatus(
    @Param("id") id: string,
    @Body() body: { status?: string },
    @Headers("x-organization-id") viewerOrg?: string,
    @Query("organizationId") organizationId?: string,
  ) {
    const order = await this.foundation.getByKey<Record<string, unknown>>("CommercialOrder", id);
    if (!order) throw new NotFoundException(commerceFoundationUxError("orderNotAccessible"));
    const viewer = viewerOrg ?? organizationId;
    if (viewer) {
      this.accessGuard.assertOrderParties(
        viewer,
        String(order.buyerActorId ?? order.buyerOrganizationId ?? ""),
        String(order.sellerActorId ?? order.sellerOrganizationId ?? ""),
        order.relationshipId as string | undefined,
      );
    }
    const saved = await this.foundation.upsert(
      "CommercialOrder",
      id,
      { ...order, status: body.status ?? order.status, updatedAt: new Date().toISOString() },
      { relationshipId: order.relationshipId as string },
    );
    return envelope(saved);
  }

  @Get("commercial-deliveries")
  async deliveries(
    @Query("relationshipId") relationshipId?: string,
    @Headers("x-organization-id") viewerOrg?: string,
  ) {
    this.accessGuard.assertRelationshipActive(relationshipId);
    if (viewerOrg && relationshipId) {
      this.accessGuard.assertCatalogAccess(relationshipId, viewerOrg);
    }
    const rows = await this.foundation.list<Record<string, unknown>>("CommercialDelivery", {
      relationshipId,
      limit: 50,
    });
    return envelope(rows);
  }

  @Get("commercial-deliveries/:id")
  async deliveryById(@Param("id") id: string) {
    const row = await this.foundation.getByKey<Record<string, unknown>>("CommercialDelivery", id);
    if (!row) throw new NotFoundException(commerceFoundationUxError("orderNotAccessible"));
    return envelope(row);
  }

  @Patch("commercial-deliveries/:id/status")
  async patchDeliveryStatus(@Param("id") id: string, @Body() body: { status?: string }) {
    const row = await this.foundation.getByKey<Record<string, unknown>>("CommercialDelivery", id);
    if (!row) throw new NotFoundException(commerceFoundationUxError("orderNotAccessible"));
    const saved = await this.foundation.upsert("CommercialDelivery", id, {
      ...row,
      status: body.status ?? row.status,
      updatedAt: new Date().toISOString(),
    });
    return envelope(saved);
  }

  @Get("commercial-settlements")
  async settlements(@Query("organizationId") organizationId?: string) {
    const rows = await this.foundation.list<Record<string, unknown>>("CommercialSettlement", {
      organizationId,
      limit: 50,
    });
    return envelope(rows);
  }

  @Post("commercial-settlements")
  async createSettlement(@Body() body: Record<string, unknown>) {
    const id = (body.id as string) ?? `settlement-${Date.now()}`;
    const saved = await this.foundation.upsert("CommercialSettlement", id, {
      ...body,
      id,
      walletDemoMode: true,
      createdAt: body.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return envelope(saved);
  }

  @Patch("commercial-settlements/:id/confirm")
  async confirmSettlement(@Param("id") id: string) {
    const row = await this.foundation.getByKey<Record<string, unknown>>("CommercialSettlement", id);
    if (!row) throw new NotFoundException(commerceFoundationUxError("settlementNotAllowed"));
    const saved = await this.foundation.upsert("CommercialSettlement", id, {
      ...row,
      status: "confirmed",
      confirmationStatus: "confirmed",
      updatedAt: new Date().toISOString(),
    });
    return envelope(saved);
  }

  @Get("commerce-messaging/conversations")
  async messagingConversations(
    @Query("relationshipId") relationshipId?: string,
    @Query("organizationId") organizationId?: string,
    @Headers("x-organization-id") viewerOrg?: string,
  ) {
    this.accessGuard.assertMessagingAccess({
      organizationId: viewerOrg ?? organizationId ?? "org",
      relationshipId,
    });
    const rows = await this.foundation.list<Record<string, unknown>>("CommerceMessageThread", {
      relationshipId,
      limit: 30,
    });
    return envelope(rows);
  }

  @Get("commerce-messaging/messages")
  async messagingMessages(
    @Query("threadId") threadId: string,
    @Query("organizationId") organizationId?: string,
    @Headers("x-organization-id") viewerOrg?: string,
  ) {
    const thread = await this.foundation.getByKey<Record<string, unknown>>("CommerceMessageThread", threadId);
    if (!thread) throw new NotFoundException(commerceFoundationUxError("relationNotFound"));
    this.accessGuard.assertMessagingAccess({
      organizationId: viewerOrg ?? organizationId ?? "org",
      relationshipId: thread.relationshipId as string | undefined,
    });
    return envelope(thread.messages ?? []);
  }

  @Post("commerce-messaging/messages")
  async postMessage(
    @Body() body: { threadId: string; text: string; from: string },
    @Query("organizationId") organizationId?: string,
    @Headers("x-organization-id") viewerOrg?: string,
  ) {
    const thread = await this.foundation.getByKey<Record<string, unknown>>("CommerceMessageThread", body.threadId);
    if (!thread) throw new NotFoundException(commerceFoundationUxError("relationNotFound"));
    this.accessGuard.assertMessagingAccess({
      organizationId: viewerOrg ?? organizationId ?? "org",
      relationshipId: thread.relationshipId as string | undefined,
    });
    const messages = Array.isArray(thread.messages) ? [...thread.messages] : [];
    messages.push({ id: `m-${Date.now()}`, from: body.from, text: body.text, at: new Date().toISOString() });
    const saved = await this.foundation.upsert(
      "CommerceMessageThread",
      body.threadId,
      { ...thread, messages, updatedAt: new Date().toISOString() },
      { relationshipId: thread.relationshipId as string },
    );
    return envelope(saved);
  }

  @Get("professional-mail/threads")
  async mailThreads(
    @Query("relationshipId") relationshipId?: string,
    @Query("organizationId") organizationId?: string,
    @Headers("x-organization-id") viewerOrg?: string,
  ) {
    this.accessGuard.assertMessagingAccess({
      organizationId: viewerOrg ?? organizationId ?? "org",
      relationshipId,
      formal: true,
    });
    const rows = await this.foundation.list<Record<string, unknown>>("ProfessionalMailThread", {
      relationshipId,
      limit: 30,
    });
    return envelope(rows);
  }

  @Get("professional-mail/threads/:id")
  async mailThread(@Param("id") id: string) {
    const row = await this.foundation.getByKey<Record<string, unknown>>("ProfessionalMailThread", id);
    if (!row) throw new NotFoundException(commerceFoundationUxError("relationNotFound"));
    return envelope(row);
  }

  @Post("professional-mail/threads")
  async createMailThread(@Body() body: Record<string, unknown>) {
    const id = (body.id as string) ?? `mail-${Date.now()}`;
    const saved = await this.foundation.upsert("ProfessionalMailThread", id, {
      ...body,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return envelope(saved);
  }

  @Get("commercial-context")
  async context(@Query("actorId") actorId: string) {
    const rows = await this.foundation.list<Record<string, unknown>>("CommercialContextState", {
      organizationId: actorId,
      limit: 1,
    });
    if (!rows[0]) throw new NotFoundException(commerceFoundationUxError("contextUnavailable"));
    return envelope(rows[0]);
  }

  @Patch("commercial-context")
  async patchContext(@Query("actorId") actorId: string, @Body() body: Record<string, unknown>) {
    const saved = await this.foundation.context.saveContext(actorId, {
      activeContext: body.activeContext as Record<string, unknown> | undefined,
      lastWorkspace: body.lastWorkspace as string | undefined,
      lastSubTab: body.lastSubTab as string | undefined,
      navigationEntry: body.navigationEntry as Record<string, unknown> | undefined,
    });
    return envelope(saved);
  }

  @Get("feature-flags")
  async featureFlags() {
    const rows = await this.foundation.list<Record<string, unknown>>("FeatureFlagState", { limit: 200 });
    return envelope(rows);
  }

  @Get("offline/bootstrap")
  async offlineBootstrap(
    @Query("organizationId") organizationId: string,
    @Query("actorRole") actorRole = "GROSSISTE_B",
    @Headers("x-organization-id") viewerOrg?: string,
  ) {
    this.accessGuard.assertOrganizationScope(viewerOrg ?? organizationId, organizationId);
    const payload = await this.offlinePersistence.buildBootstrap(organizationId, actorRole);
    return envelope(payload);
  }

  @Post("offline/sync")
  async offlineSync(
    @Query("organizationId") organizationId: string,
    @Body() body: Record<string, unknown>,
  ) {
    await this.offlinePersistence.syncSnapshot(organizationId, body);
    return envelope({ synced: true, organizationId });
  }

  @Post("offline/replay")
  async offlineReplay(
    @Query("organizationId") organizationId: string,
    @Body() body: { actions?: { id: string; type: string }[] },
  ) {
    const actions = body.actions ?? [];
    let replayed = 0;
    const conflicts: string[] = [];
    for (const action of actions) {
      if (action.type === "MARK_NOTIFICATION_READ") {
        const saved = await this.notificationPersistence.markRead(action.id, organizationId);
        if (saved) replayed += 1;
        else conflicts.push(action.id);
      } else {
        replayed += 1;
      }
    }
    return envelope({ replayed, conflicts, organizationId });
  }

  @Get("activity-feed")
  async listActivityFeed(
    @Query("organizationId") organizationId: string,
    @Headers("x-organization-id") viewerOrg?: string,
  ) {
    this.accessGuard.assertOrganizationScope(viewerOrg ?? organizationId, organizationId);
    const rows = await this.activityFeedPersistence.listActivities(organizationId);
    return envelope(rows);
  }

  @Get("activity-feed/summary")
  async activityFeedSummary(@Query("organizationId") organizationId: string) {
    const rows = await this.activityFeedPersistence.listActivities(organizationId);
    return envelope(this.activityFeedPersistence.buildSummary(organizationId, rows));
  }

  @Patch("activity-feed/:id/read")
  async markActivityRead(
    @Param("id") id: string,
    @Query("organizationId") organizationId: string,
  ) {
    const saved = await this.activityFeedPersistence.markRead(id, organizationId);
    if (!saved) throw new NotFoundException(commerceFoundationUxError("orderNotAccessible"));
    return envelope(saved);
  }

  @Get("notifications")
  async listNotifications(
    @Query("organizationId") organizationId: string,
    @Headers("x-organization-id") viewerOrg?: string,
  ) {
    this.accessGuard.assertOrganizationScope(viewerOrg ?? organizationId, organizationId);
    const rows = await this.notificationPersistence.listNotifications(organizationId);
    return envelope(rows);
  }

  @Patch("notifications/:id/read")
  async markNotificationRead(
    @Param("id") id: string,
    @Query("organizationId") organizationId: string,
  ) {
    const saved = await this.notificationPersistence.markRead(id, organizationId);
    if (!saved) throw new NotFoundException(commerceFoundationUxError("orderNotAccessible"));
    return envelope(saved);
  }

  @Patch("notifications/read-all")
  async markAllNotificationsRead(@Query("organizationId") organizationId: string) {
    const result = await this.notificationPersistence.markAllRead(organizationId);
    return envelope(result);
  }

  @Get("notifications/preferences")
  async getNotificationPreferences(@Query("organizationId") organizationId: string) {
    const prefs = await this.notificationPersistence.getPreferences(organizationId);
    return envelope(prefs);
  }

  @Patch("notifications/preferences")
  async patchNotificationPreferences(
    @Query("organizationId") organizationId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const saved = await this.notificationPersistence.savePreferences(organizationId, body);
    return envelope(saved);
  }

  @Get("wallet-demo")
  async walletDemo(@Query("organizationId") organizationId: string) {
    const row = await this.foundation.getByKey<Record<string, unknown>>("WalletDemoState", organizationId);
    if (!row) throw new NotFoundException(commerceFoundationUxError("walletNotActivated"));
    return envelope(row);
  }

  /** Terrain BFF envelope mappers */
  @Get("grossiste-b/:endpoint")
  async grossisteBEnvelope(
    @Param("endpoint") endpoint: string,
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId?: string,
  ) {
    if (endpoint === "catalog") {
      this.accessGuard.assertCatalogAccess(relationshipId, organizationId);
    }
    if (endpoint === "orders") {
      this.accessGuard.assertOrganizationScope(organizationId, organizationId, relationshipId);
    }
    return this.mappers.mapGrossisteB(endpoint, organizationId);
  }

  @Get("grossiste-a/:endpoint")
  async grossisteAEnvelope(
    @Param("endpoint") endpoint: string,
    @Query("organizationId") organizationId: string,
    @Query("pole") pole?: string,
    @Query("actorRole") actorRole?: string,
    @Headers("x-actor-role") headerRole?: string,
  ) {
    const role = actorRole ?? headerRole;
    this.grossisteAPoleGuard.assertActorRoute(role, `/commerce-foundation/grossiste-a/${endpoint}`);
    this.grossisteAPoleGuard.assertPoleAccess(role, pole);
    return this.mappers.mapGrossisteA(endpoint, organizationId);
  }

  @Get("producer/:endpoint")
  async producerEnvelope(
    @Param("endpoint") endpoint: string,
    @Query("organizationId") organizationId: string,
    @Query("actorRole") actorRole?: string,
    @Headers("x-actor-role") headerRole?: string,
  ) {
    this.grossisteAPoleGuard.assertActorRoute(
      actorRole ?? headerRole,
      `/commerce-foundation/producer/${endpoint}`,
    );
    return this.mappers.mapProducer(endpoint, organizationId || DEMO_ORG_PRODUCER);
  }

  @Get("terrain/search")
  async terrainSearch(
    @Query("q") q: string,
    @Query("organizationId") organizationId: string,
    @Query("actorRole") actorRole?: string,
  ) {
    const result = await this.terrainSearchService.search(String(q ?? ""), String(organizationId ?? ""), actorRole);
    return envelope(result);
  }

  @Post("detaillant/register")
  async registerDetaillant(
    @Body()
    body: {
      phone: string;
      displayName: string;
      activities?: string[];
      city: string;
      businessName?: string;
    },
  ) {
    const result = await this.detaillantRegistration.register({
      phone: String(body.phone ?? ""),
      displayName: String(body.displayName ?? ""),
      activities: Array.isArray(body.activities) ? body.activities.map(String) : [],
      city: String(body.city ?? ""),
      businessName: body.businessName ? String(body.businessName) : undefined,
    });
    return envelope(result);
  }

  @Get("detaillant/:endpoint")
  async detaillantEnvelope(
    @Param("endpoint") endpoint: string,
    @Query("organizationId") organizationId: string,
  ) {
    return this.mappers.mapDetaillant(endpoint, organizationId);
  }

  @Get("commerce-wallet/:endpoint")
  async commerceWalletEnvelope(
    @Param("endpoint") endpoint: string,
    @Query("organizationId") organizationId: string,
  ) {
    this.accessGuard.assertWalletAccess(organizationId, organizationId);
    return this.mappers.mapWallet(endpoint, organizationId);
  }

  @Get("enterprise/channels")
  async listEnterpriseChannels() {
    const rows = await this.enterpriseGovernance.listChannels();
    return envelope(rows);
  }

  @Post("enterprise/channels")
  async createEnterpriseChannel(@Body() body: Record<string, unknown>) {
    const enterpriseId = String(body.enterpriseId ?? "");
    if (!enterpriseId) throw new BadRequestException("enterpriseId required");
    const saved = await this.enterpriseGovernance.upsertChannel(enterpriseId, {
      enterpriseId,
      accountSegment: "LARGE_ACCOUNTS",
      actorKind: body.actorKind ?? "producteur",
      contractReference: String(body.contractReference ?? ""),
      companyName: String(body.companyName ?? ""),
      headquarters: String(body.headquarters ?? ""),
      governanceStatus: body.governanceStatus ?? "DRAFT",
      onboardingProgress: Number(body.onboardingProgress ?? 0),
      activationStatus: body.activationStatus ?? "PENDING_VALIDATION",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    } as never);
    return envelope(saved);
  }

  @Get("enterprise/poles/canonical")
  async listCanonicalEnterprisePoles() {
    return envelope(this.enterpriseGovernance.listCanonicalPoleIds());
  }

  @Get("enterprise/channels/:enterpriseId/poles")
  async listEnterprisePoleActivations(@Param("enterpriseId") enterpriseId: string) {
    const rows = await this.enterpriseGovernance.listPoleActivations(enterpriseId);
    return envelope(rows);
  }

  @Post("enterprise/channels/:enterpriseId/poles")
  async activateEnterprisePole(
    @Param("enterpriseId") enterpriseId: string,
    @Body() body: { poleId: string; activation?: Record<string, unknown> },
  ) {
    this.enterpriseGovernance.assertPoleExists(body.poleId);
    const entityKey = `epa-${enterpriseId}-${body.poleId}`;
    const saved = await this.enterpriseGovernance.upsertPoleActivation(
      entityKey,
      {
        id: entityKey,
        enterpriseId,
        poleId: body.poleId,
        activated: true,
        createdAt: new Date().toISOString(),
        ...body.activation,
      },
      enterpriseId,
    );
    return envelope(saved);
  }

  @Get("enterprise/activation-queue")
  async enterpriseActivationQueue() {
    const rows = await this.enterpriseGovernance.listPendingCollaborators();
    return envelope(rows);
  }

  @Post("enterprise/collaborators")
  async registerEnterpriseCollaborator(@Body() body: Record<string, unknown>) {
    const internalId = String(body.internalEnterpriseUserId ?? `ieu-${Date.now()}`);
    const enterpriseId = String(body.enterpriseId ?? "");
    if (body.poleId) this.enterpriseGovernance.assertPoleExists(String(body.poleId));
    const saved = await this.enterpriseGovernance.upsertCollaborator(
      internalId,
      { status: "PENDING_VALIDATION", createdAt: new Date().toISOString(), ...body },
      enterpriseId,
    );
    return envelope(saved);
  }

  @Patch("enterprise/collaborators/:id/review")
  async reviewEnterpriseCollaborator(
    @Param("id") id: string,
    @Body() body: { action: "ACTIVATE" | "BLOCK" | "REJECT" | "SUSPEND" },
  ) {
    const existing = await this.enterpriseGovernance.getCollaborator(id);
    if (!existing) throw new NotFoundException("collaborator not found");
    const status =
      body.action === "ACTIVATE"
        ? "ACTIVE"
        : body.action === "BLOCK"
          ? "BLOCKED"
          : body.action === "REJECT"
            ? "REJECTED"
            : "SUSPENDED";
    const saved = await this.enterpriseGovernance.upsertCollaborator(
      id,
      { ...existing, status },
      String(existing.enterpriseId ?? ""),
    );
    return envelope(saved);
  }

  @Post("enterprise/security/actions")
  async executeEnterpriseSecurityAction(@Body() body: Record<string, unknown>) {
    const saved = await this.enterpriseGovernance.recordSecurityAction(body);
    return envelope(saved);
  }

  @Get("enterprise/security/history")
  async listEnterpriseSecurityHistory(@Query("enterpriseId") enterpriseId: string) {
    const rows = await this.enterpriseGovernance.listGovernanceHistory(enterpriseId);
    return envelope(rows);
  }

  @Get("enterprise/security/alerts")
  async listEnterpriseSecurityAlerts(@Query("enterpriseId") enterpriseId: string) {
    const rows = await this.enterpriseGovernance.listSecurityAlerts(enterpriseId);
    return envelope(rows);
  }
}
