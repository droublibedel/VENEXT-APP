import { Injectable } from "@nestjs/common";

import { CommerceFoundationRepository } from "../commerce-foundation.repository";
import { BaseCommercePersistenceService } from "./base-commerce-persistence.service";

@Injectable()
export class ProfessionalMailPersistenceService extends BaseCommercePersistenceService {
  constructor(repo: CommerceFoundationRepository) {
    super(repo);
  }

  listThreads(filter: Parameters<CommerceFoundationRepository["list"]>[1] = {}) {
    return this.list<Record<string, unknown>>("ProfessionalMailThread", filter);
  }

  getThread(id: string) {
    return this.getByKey<Record<string, unknown>>("ProfessionalMailThread", id);
  }

  saveThread(id: string, payload: Record<string, unknown>, relationshipId?: string) {
    return this.upsert("ProfessionalMailThread", id, payload, { relationshipId });
  }
}
