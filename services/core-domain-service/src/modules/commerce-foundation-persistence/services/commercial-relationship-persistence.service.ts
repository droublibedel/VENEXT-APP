import { Injectable } from "@nestjs/common";

import { commerceFoundationUxError } from "../commerce-foundation.errors";
import { CommerceFoundationRepository } from "../commerce-foundation.repository";
import { BaseCommercePersistenceService } from "./base-commerce-persistence.service";

@Injectable()
export class CommercialRelationshipPersistenceService extends BaseCommercePersistenceService {
  constructor(repo: CommerceFoundationRepository) {
    super(repo);
  }

  listRelationships(filter: Parameters<CommerceFoundationRepository["list"]>[1] = {}) {
    return this.list<Record<string, unknown>>("CommercialRelationship", filter);
  }

  listForOrganization(organizationId: string) {
    return this.listRelationships({ limit: 50 }).then((rows) =>
      rows.filter((r) => r.actorAId === organizationId || r.actorBId === organizationId),
    );
  }

  getRelationship(id: string) {
    return this.getByKey<Record<string, unknown>>("CommercialRelationship", id);
  }

  saveRelationship(id: string, payload: Record<string, unknown>) {
    return this.upsert("CommercialRelationship", id, payload, { relationshipId: id });
  }

  assertParticipant(relationship: Record<string, unknown>, organizationId: string) {
    if (
      relationship.actorAId !== organizationId &&
      relationship.actorBId !== organizationId
    ) {
      throw new Error(commerceFoundationUxError("relationNotFound"));
    }
  }
}
