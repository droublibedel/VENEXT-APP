import { Injectable } from "@nestjs/common";

import { BaseCommercePersistenceService } from "./base-commerce-persistence.service";
import { CommerceFoundationRepository } from "../commerce-foundation.repository";

export type CommerceActivityFeedRecord = {
  id: string;
  eventType: string;
  category: string;
  actorRole: string;
  organizationId: string;
  relationshipId?: string;
  partnerId?: string;
  titleKey: string;
  summaryKey?: string;
  read: boolean;
  occurredAt: string;
  contextLink?: Record<string, unknown>;
  meta?: Record<string, string>;
};

export type CommerceActivitySummaryRecord = {
  organizationId: string;
  totalToday: number;
  ordersToday: number;
  deliveriesToday: number;
  partnersActive: number;
  headlineKey: string;
};

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function isToday(iso: string, now = new Date()): boolean {
  return new Date(iso).getTime() >= startOfDay(now);
}

@Injectable()
export class CommerceActivityFeedPersistenceService extends BaseCommercePersistenceService {
  constructor(repo: CommerceFoundationRepository) {
    super(repo);
  }

  listActivities(organizationId: string) {
    return this.list<CommerceActivityFeedRecord>("CommerceActivityFeed", {
      organizationId,
      limit: 200,
    });
  }

  getActivity(id: string) {
    return this.getByKey<CommerceActivityFeedRecord>("CommerceActivityFeed", id);
  }

  saveActivity(id: string, payload: CommerceActivityFeedRecord) {
    return this.upsert("CommerceActivityFeed", id, payload, {
      organizationId: payload.organizationId,
      actorRole: payload.actorRole,
      relationshipId: payload.relationshipId,
    });
  }

  markRead(id: string, organizationId: string) {
    return this.getActivity(id).then(async (row) => {
      if (!row || row.organizationId !== organizationId) return null;
      return this.saveActivity(id, { ...row, read: true });
    });
  }

  buildSummary(organizationId: string, items: CommerceActivityFeedRecord[]): CommerceActivitySummaryRecord {
    const todayItems = items.filter((i) => isToday(i.occurredAt));
    const ordersToday = todayItems.filter((i) => i.category === "orders").length;
    const deliveriesToday = todayItems.filter((i) => i.category === "deliveries").length;
    const partners = new Set(
      todayItems.map((i) => i.partnerId ?? i.relationshipId).filter(Boolean),
    );
    let headlineKey = "activity.summary.quiet";
    if (ordersToday >= 3) headlineKey = "activity.summary.orders_busy";
    else if (deliveriesToday >= 2) headlineKey = "activity.summary.deliveries_active";
    return {
      organizationId,
      totalToday: todayItems.length,
      ordersToday,
      deliveriesToday,
      partnersActive: partners.size,
      headlineKey,
    };
  }

  seedDemoActivities(organizationId: string, items: CommerceActivityFeedRecord[]) {
    return Promise.all(
      items.map((item) => this.saveActivity(item.id, { ...item, organizationId })),
    );
  }
}
