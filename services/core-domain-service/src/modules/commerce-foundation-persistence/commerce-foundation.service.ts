import { Injectable } from "@nestjs/common";
import type { CommerceFoundationEntityType } from "@venext/shared-contracts";

import { CommerceFoundationRepository } from "./commerce-foundation.repository";
import { buildCommerceFoundationDemoSeed } from "./demo/commerce-foundation-demo.seed";
import { ActorProfilePersistenceService } from "./services/actor-profile-persistence.service";
import { CommercialContextPersistenceService } from "./services/commercial-context-persistence.service";
import { CommercialDeliveryPersistenceService } from "./services/commercial-delivery-persistence.service";
import { CommercialOrderPersistenceService } from "./services/commercial-order-persistence.service";
import { CommercialRelationshipPersistenceService } from "./services/commercial-relationship-persistence.service";
import { CommercialSettlementPersistenceService } from "./services/commercial-settlement-persistence.service";
import { CommerceMessagingPersistenceService } from "./services/commerce-messaging-persistence.service";
import { ProfessionalMailPersistenceService } from "./services/professional-mail-persistence.service";
import { RelationalCatalogPersistenceService } from "./services/relational-catalog-persistence.service";
import { CommerceActivityFeedPersistenceService } from "./services/commerce-activity-feed-persistence.service";
import { CommerceNotificationPersistenceService } from "./services/commerce-notification-persistence.service";

/** Façade légère — compose les services de persistance (Instruction 20.79-A). */
@Injectable()
export class CommerceFoundationService {
  constructor(
    private readonly repo: CommerceFoundationRepository,
    readonly actors: ActorProfilePersistenceService,
    readonly relationships: CommercialRelationshipPersistenceService,
    readonly catalogs: RelationalCatalogPersistenceService,
    readonly orders: CommercialOrderPersistenceService,
    readonly deliveries: CommercialDeliveryPersistenceService,
    readonly settlements: CommercialSettlementPersistenceService,
    readonly messaging: CommerceMessagingPersistenceService,
    readonly mail: ProfessionalMailPersistenceService,
    readonly context: CommercialContextPersistenceService,
    readonly notifications: CommerceNotificationPersistenceService,
    readonly activityFeed: CommerceActivityFeedPersistenceService,
  ) {}

  async seedDemoIfEmpty(): Promise<{ inserted: number }> {
    const count = await this.repo.count("ActorProfile");
    if (count > 0) return { inserted: 0 };
    const seed = buildCommerceFoundationDemoSeed();
    for (const row of seed) {
      await this.repo.upsert(row.entityType as CommerceFoundationEntityType, row.entityKey, row.payload, {
        organizationId: row.organizationId,
        relationshipId: row.relationshipId,
        actorRole: row.actorRole,
      });
    }
    return { inserted: seed.length };
  }

  async resetDemo(): Promise<{ deleted: number }> {
    const types: CommerceFoundationEntityType[] = [
      "ActorProfile",
      "CommercialRelationship",
      "RelationalCatalog",
      "CommercialOrder",
      "CommercialDelivery",
      "CommercialSettlement",
      "CommerceMessageThread",
      "ProfessionalMailThread",
      "CommercialContextState",
      "FeatureFlagState",
      "WalletDemoState",
      "CommerceNotification",
      "CommerceNotificationPreferences",
      "CommerceActivityFeed",
      "CommerceOfflineSnapshot",
    ];
    let deleted = 0;
    for (const entityType of types) {
      const rows = await this.repo.list(entityType, { limit: 500 });
      for (const row of rows) {
        await this.repo.softDelete(entityType, row.entityKey);
        deleted += 1;
      }
    }
    return { deleted };
  }

  /** @deprecated Préférer les services dédiés — conservé pour compatibilité controller. */
  list<T>(entityType: CommerceFoundationEntityType, filter: Parameters<CommerceFoundationRepository["list"]>[1] = {}) {
    return this.repo.list(entityType, filter).then((rows) => rows.map((r) => r.payload as T));
  }

  getByKey<T>(entityType: CommerceFoundationEntityType, entityKey: string) {
    return this.repo.getByKey(entityType, entityKey).then((row) => (row ? (row.payload as T) : null));
  }

  upsert<T>(
    entityType: CommerceFoundationEntityType,
    entityKey: string,
    payload: T,
    meta: Parameters<CommerceFoundationRepository["upsert"]>[3] = {},
  ) {
    return this.repo.upsert(entityType, entityKey, payload, meta).then((row) => row.payload as T);
  }

  assertCatalogAccess(relationshipId: string, organizationId: string, catalogRelationshipId: string) {
    return this.catalogs.assertCatalogAccess(relationshipId, organizationId, catalogRelationshipId);
  }

  assertOrderAccess(order: { buyerActorId: string; sellerActorId: string }, organizationId: string) {
    return this.orders.assertOrderAccess(order, organizationId);
  }
}
