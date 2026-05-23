import { Injectable } from "@nestjs/common";

import { BaseCommercePersistenceService } from "./base-commerce-persistence.service";
import { CommerceFoundationRepository } from "../commerce-foundation.repository";
import { CommerceActivityFeedPersistenceService } from "./commerce-activity-feed-persistence.service";
import { CommerceNotificationPersistenceService } from "./commerce-notification-persistence.service";

export type CommerceOfflineBootstrapRecord = {
  organizationId: string;
  actorRole: string;
  cachedAt: string;
  recentOrders: unknown[];
  recentDeliveries: unknown[];
  recentActivity: unknown[];
  notifications: unknown[];
  recentConversations: unknown[];
  relationalCatalog: unknown[];
  commercialContext: Record<string, unknown> | null;
  preferences: Record<string, unknown>;
};

@Injectable()
export class CommerceOfflinePersistenceService extends BaseCommercePersistenceService {
  constructor(
    repo: CommerceFoundationRepository,
    private readonly notifications: CommerceNotificationPersistenceService,
    private readonly activityFeed: CommerceActivityFeedPersistenceService,
  ) {
    super(repo);
  }

  async buildBootstrap(organizationId: string, actorRole: string): Promise<CommerceOfflineBootstrapRecord> {
    const [notifications, activities] = await Promise.all([
      this.notifications.listNotifications(organizationId),
      this.activityFeed.listActivities(organizationId),
    ]);
    return {
      organizationId,
      actorRole,
      cachedAt: new Date().toISOString(),
      recentOrders: [],
      recentDeliveries: [],
      recentActivity: activities.slice(0, 20),
      notifications: notifications.slice(0, 30),
      recentConversations: [],
      relationalCatalog: [],
      commercialContext: { activeModule: "order" },
      preferences: { locale: "fr-CI" },
    };
  }

  syncSnapshot(organizationId: string, patch: Record<string, unknown>) {
    return this.upsert("CommerceOfflineSnapshot", `snapshot-${organizationId}`, patch, {
      organizationId,
    });
  }
}
