import { Injectable, NotFoundException } from "@nestjs/common";
import { FeatureFlagScopeType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type UpsertFeatureFlagInput = {
  key: string;
  enabled: boolean;
  description?: string;
  scopeType?: FeatureFlagScopeType;
  scopeValue?: string | null;
};

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertRuntime(input: UpsertFeatureFlagInput) {
    const scopeType = input.scopeType ?? FeatureFlagScopeType.GLOBAL;
    const scopeValue = input.scopeValue ?? "";
    return this.prisma.featureFlag.upsert({
      where: {
        key_scopeType_scopeValue: {
          key: input.key,
          scopeType,
          scopeValue,
        },
      },
      create: {
        key: input.key,
        enabled: input.enabled,
        description: input.description ?? "",
        scopeType,
        scopeValue,
      },
      update: {
        enabled: input.enabled,
        ...(input.description != null ? { description: input.description } : {}),
      },
    });
  }

  findRuntime(filters?: {
    scopeType?: FeatureFlagScopeType;
    scopeValue?: string;
    key?: string;
  }) {
    return this.prisma.featureFlag.findMany({
      where: {
        scopeType: filters?.scopeType,
        scopeValue: filters?.scopeValue,
        key: filters?.key,
      },
      orderBy: [{ key: "asc" }, { scopeType: "asc" }],
      take: 500,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(id);
    return row;
  }
}
