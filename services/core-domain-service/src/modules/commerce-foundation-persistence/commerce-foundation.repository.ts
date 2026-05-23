import { Injectable } from "@nestjs/common";
import type { CommerceFoundationEntityType } from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";

export type CommerceFoundationRecordRow = {
  id: string;
  entityType: string;
  entityKey: string;
  organizationId: string | null;
  relationshipId: string | null;
  actorRole: string | null;
  payload: unknown;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CommerceFoundationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    entityType: CommerceFoundationEntityType,
    filter: {
      organizationId?: string;
      relationshipId?: string;
      actorRole?: string;
      limit?: number;
    } = {},
  ): Promise<CommerceFoundationRecordRow[]> {
    const rows = await this.prisma.commerceFoundationRecord.findMany({
      where: {
        entityType,
        deletedAt: null,
        ...(filter.organizationId ? { organizationId: filter.organizationId } : {}),
        ...(filter.relationshipId ? { relationshipId: filter.relationshipId } : {}),
        ...(filter.actorRole ? { actorRole: filter.actorRole } : {}),
      },
      take: Math.min(filter.limit ?? 50, 100),
      orderBy: { updatedAt: "desc" },
    });
    return rows as CommerceFoundationRecordRow[];
  }

  async getByKey(
    entityType: CommerceFoundationEntityType,
    entityKey: string,
  ): Promise<CommerceFoundationRecordRow | null> {
    const row = await this.prisma.commerceFoundationRecord.findFirst({
      where: { entityType, entityKey, deletedAt: null },
    });
    return row as CommerceFoundationRecordRow | null;
  }

  async upsert(
    entityType: CommerceFoundationEntityType,
    entityKey: string,
    payload: unknown,
    meta: {
      organizationId?: string;
      relationshipId?: string;
      actorRole?: string;
    } = {},
  ): Promise<CommerceFoundationRecordRow> {
    const row = await this.prisma.commerceFoundationRecord.upsert({
      where: { entityType_entityKey: { entityType, entityKey } },
      create: {
        entityType,
        entityKey,
        payload: payload as object,
        organizationId: meta.organizationId ?? null,
        relationshipId: meta.relationshipId ?? null,
        actorRole: meta.actorRole ?? null,
      },
      update: {
        payload: payload as object,
        organizationId: meta.organizationId ?? undefined,
        relationshipId: meta.relationshipId ?? undefined,
        actorRole: meta.actorRole ?? undefined,
        deletedAt: null,
      },
    });
    return row as CommerceFoundationRecordRow;
  }

  async softDelete(entityType: CommerceFoundationEntityType, entityKey: string): Promise<void> {
    await this.prisma.commerceFoundationRecord.updateMany({
      where: { entityType, entityKey },
      data: { deletedAt: new Date() },
    });
  }

  async count(entityType: CommerceFoundationEntityType): Promise<number> {
    return this.prisma.commerceFoundationRecord.count({
      where: { entityType, deletedAt: null },
    });
  }
}
