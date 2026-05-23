import type { CommerceFoundationEntityType } from "@venext/shared-contracts";

import { CommerceFoundationRepository } from "../commerce-foundation.repository";

/** Thin CRUD helper — no business rules (Instruction 20.79-A). */
export abstract class BaseCommercePersistenceService {
  constructor(protected readonly repo: CommerceFoundationRepository) {}

  protected list<T>(
    entityType: CommerceFoundationEntityType,
    filter: Parameters<CommerceFoundationRepository["list"]>[1] = {},
  ) {
    return this.repo.list(entityType, filter).then((rows) => rows.map((r) => r.payload as T));
  }

  protected getByKey<T>(entityType: CommerceFoundationEntityType, entityKey: string) {
    return this.repo.getByKey(entityType, entityKey).then((row) => (row ? (row.payload as T) : null));
  }

  protected upsert<T>(
    entityType: CommerceFoundationEntityType,
    entityKey: string,
    payload: T,
    meta: Parameters<CommerceFoundationRepository["upsert"]>[3] = {},
  ) {
    return this.repo.upsert(entityType, entityKey, payload, meta).then((row) => row.payload as T);
  }
}
