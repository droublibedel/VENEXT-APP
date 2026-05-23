import { Injectable } from "@nestjs/common";

import { BaseCommercePersistenceService } from "./base-commerce-persistence.service";
import { CommerceFoundationRepository } from "../commerce-foundation.repository";

export type CommerceNotificationRecord = {
  id: string;
  eventType: string;
  priority: string;
  category: string;
  actorRole: string;
  organizationId: string;
  titleKey: string;
  bodyKey?: string;
  read: boolean;
  createdAt: string;
  contextLink?: Record<string, unknown>;
  meta?: Record<string, string>;
};

export type CommerceNotificationPreferencesRecord = {
  orders: boolean;
  deliveries: boolean;
  settlements: boolean;
  messages: boolean;
  mails: boolean;
  relations: boolean;
  catalogs: boolean;
  walletSecurity: boolean;
  sponsoredCatalogs: boolean;
};

const DEFAULT_PREFS: CommerceNotificationPreferencesRecord = {
  orders: true,
  deliveries: true,
  settlements: true,
  messages: true,
  mails: true,
  relations: true,
  catalogs: true,
  walletSecurity: true,
  sponsoredCatalogs: false,
};

@Injectable()
export class CommerceNotificationPersistenceService extends BaseCommercePersistenceService {
  constructor(repo: CommerceFoundationRepository) {
    super(repo);
  }

  prefsKey(organizationId: string) {
    return `prefs-${organizationId}`;
  }

  listNotifications(organizationId: string) {
    return this.list<CommerceNotificationRecord>("CommerceNotification", {
      organizationId,
      limit: 100,
    });
  }

  getNotification(id: string) {
    return this.getByKey<CommerceNotificationRecord>("CommerceNotification", id);
  }

  saveNotification(id: string, payload: CommerceNotificationRecord) {
    return this.upsert("CommerceNotification", id, payload, {
      organizationId: payload.organizationId,
      actorRole: payload.actorRole,
    });
  }

  markRead(id: string, organizationId: string) {
    return this.getNotification(id).then(async (row) => {
      if (!row || row.organizationId !== organizationId) return null;
      return this.saveNotification(id, { ...row, read: true });
    });
  }

  markAllRead(organizationId: string) {
    return this.listNotifications(organizationId).then(async (rows) => {
      for (const row of rows) {
        if (!row.read) await this.saveNotification(row.id, { ...row, read: true });
      }
      return { updated: rows.filter((r) => !r.read).length };
    });
  }

  getPreferences(organizationId: string) {
    return this.getByKey<CommerceNotificationPreferencesRecord>(
      "CommerceNotificationPreferences",
      this.prefsKey(organizationId),
    ).then((p) => p ?? { ...DEFAULT_PREFS });
  }

  savePreferences(organizationId: string, patch: Partial<CommerceNotificationPreferencesRecord>) {
    return this.getPreferences(organizationId).then((existing) =>
      this.upsert(
        "CommerceNotificationPreferences",
        this.prefsKey(organizationId),
        { ...existing, ...patch },
        { organizationId },
      ),
    );
  }

  seedDemoNotifications(
    organizationId: string,
    actorRole: string,
    items: CommerceNotificationRecord[],
  ) {
    return Promise.all(
      items.map((item) => this.saveNotification(item.id, { ...item, organizationId, actorRole })),
    );
  }
}
