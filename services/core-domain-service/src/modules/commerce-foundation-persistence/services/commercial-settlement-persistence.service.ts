import { Injectable } from "@nestjs/common";

import { CommerceFoundationRepository } from "../commerce-foundation.repository";
import { BaseCommercePersistenceService } from "./base-commerce-persistence.service";

@Injectable()
export class CommercialSettlementPersistenceService extends BaseCommercePersistenceService {
  constructor(repo: CommerceFoundationRepository) {
    super(repo);
  }

  listSettlements(filter: Parameters<CommerceFoundationRepository["list"]>[1] = {}) {
    return this.list<Record<string, unknown>>("CommercialSettlement", filter);
  }

  getSettlement(id: string) {
    return this.getByKey<Record<string, unknown>>("CommercialSettlement", id);
  }

  saveSettlement(id: string, payload: Record<string, unknown>, relationshipId?: string) {
    return this.upsert("CommercialSettlement", id, { ...payload, walletDemoMode: true }, { relationshipId });
  }
}
