import { Injectable } from "@nestjs/common";

import { CommerceFoundationRepository } from "../commerce-foundation.repository";
import { BaseCommercePersistenceService } from "./base-commerce-persistence.service";

@Injectable()
export class CommercialDeliveryPersistenceService extends BaseCommercePersistenceService {
  constructor(repo: CommerceFoundationRepository) {
    super(repo);
  }

  listDeliveries(filter: Parameters<CommerceFoundationRepository["list"]>[1] = {}) {
    return this.list<Record<string, unknown>>("CommercialDelivery", filter);
  }

  getDelivery(id: string) {
    return this.getByKey<Record<string, unknown>>("CommercialDelivery", id);
  }

  saveDelivery(id: string, payload: Record<string, unknown>, relationshipId?: string) {
    return this.upsert("CommercialDelivery", id, payload, { relationshipId });
  }
}
