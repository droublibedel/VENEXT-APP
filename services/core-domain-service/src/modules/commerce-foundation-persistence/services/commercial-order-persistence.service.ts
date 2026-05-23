import { Injectable } from "@nestjs/common";

import { commerceFoundationUxError } from "../commerce-foundation.errors";
import { CommerceFoundationRepository } from "../commerce-foundation.repository";
import { BaseCommercePersistenceService } from "./base-commerce-persistence.service";

@Injectable()
export class CommercialOrderPersistenceService extends BaseCommercePersistenceService {
  constructor(repo: CommerceFoundationRepository) {
    super(repo);
  }

  listOrders(filter: Parameters<CommerceFoundationRepository["list"]>[1] = {}) {
    return this.list<Record<string, unknown>>("CommercialOrder", filter);
  }

  getOrder(id: string) {
    return this.getByKey<Record<string, unknown>>("CommercialOrder", id);
  }

  saveOrder(id: string, payload: Record<string, unknown>, relationshipId?: string) {
    return this.upsert("CommercialOrder", id, payload, { relationshipId });
  }

  assertOrderAccess(order: { buyerActorId: string; sellerActorId: string }, organizationId: string) {
    if (order.buyerActorId !== organizationId && order.sellerActorId !== organizationId) {
      throw new Error(commerceFoundationUxError("orderNotAccessible"));
    }
  }
}
