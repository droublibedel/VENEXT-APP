import { Injectable } from "@nestjs/common";

import { BaseCommercePersistenceService } from "./base-commerce-persistence.service";
import { CommerceFoundationRepository } from "../commerce-foundation.repository";

@Injectable()
export class ActorProfilePersistenceService extends BaseCommercePersistenceService {
  constructor(repo: CommerceFoundationRepository) {
    super(repo);
  }

  listProfiles(filter: Parameters<CommerceFoundationRepository["list"]>[1] = {}) {
    return this.list<Record<string, unknown>>("ActorProfile", filter);
  }

  getProfile(id: string) {
    return this.getByKey<Record<string, unknown>>("ActorProfile", id);
  }

  saveProfile(id: string, payload: Record<string, unknown>, meta = {}) {
    return this.upsert("ActorProfile", id, payload, meta);
  }
}
