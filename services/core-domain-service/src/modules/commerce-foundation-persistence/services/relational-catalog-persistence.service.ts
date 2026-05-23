import { Injectable } from "@nestjs/common";

import { commerceFoundationUxError } from "../commerce-foundation.errors";
import { CommerceFoundationRepository } from "../commerce-foundation.repository";
import { BaseCommercePersistenceService } from "./base-commerce-persistence.service";

@Injectable()
export class RelationalCatalogPersistenceService extends BaseCommercePersistenceService {
  constructor(repo: CommerceFoundationRepository) {
    super(repo);
  }

  listCatalogs(filter: Parameters<CommerceFoundationRepository["list"]>[1] = {}) {
    return this.list<Record<string, unknown>>("RelationalCatalog", filter);
  }

  getCatalog(id: string) {
    return this.getByKey<Record<string, unknown>>("RelationalCatalog", id);
  }

  assertCatalogAccess(relationshipId: string, organizationId: string, catalogRelationshipId: string) {
    if (catalogRelationshipId !== relationshipId) {
      throw new Error(commerceFoundationUxError("catalogUnavailable"));
    }
    if (!organizationId) {
      throw new Error(commerceFoundationUxError("relationNotFound"));
    }
  }
}
