import { Injectable } from "@nestjs/common";
import { FeatureFlagScopeType } from "@prisma/client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { FeatureFlagsService } from "../../feature-flags/feature-flags.service";
import { PrismaService } from "../../prisma/prisma.service";
import { BackofficeAuditLogService } from "../backoffice-audit-log/backoffice-audit-log.service";
import { BACKOFFICE_GOVERNED_FLAG_KEYS } from "../backoffice/governance-keys";

@Injectable()
export class BackofficeFeatureControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: FeatureFlagsService,
    private readonly canonical: CanonicalFeatureFlagEvaluator,
    private readonly audit: BackofficeAuditLogService,
  ) {}

  async listDefinitions() {
    const keys = [...BACKOFFICE_GOVERNED_FLAG_KEYS];
    const rows = await this.prisma.featureFlag.findMany({
      where: { key: { in: keys } },
      orderBy: [{ key: "asc" }, { scopeType: "asc" }],
      take: 800,
    });
    const canonicalGlobalSamples: Record<string, Awaited<ReturnType<CanonicalFeatureFlagEvaluator["evaluate"]>>> = {};
    for (const k of keys) {
      canonicalGlobalSamples[k] = await this.canonical.evaluate(k, {});
    }
    return { governedKeys: keys, rows, canonicalGlobalSamples };
  }

  async patchFlag(input: {
    actor: string;
    key: string;
    enabled: boolean;
    description?: string;
    scopeType?: FeatureFlagScopeType;
    scopeValue?: string | null;
    evaluateAs?: { organizationId?: string; role?: string; country?: string; region?: string };
  }) {
    const scopeType = input.scopeType ?? FeatureFlagScopeType.GLOBAL;
    const scopeValue = input.scopeValue ?? "";
    const before = await this.prisma.featureFlag.findFirst({
      where: { key: input.key, scopeType, scopeValue },
    });
    const row = await this.flags.upsertRuntime({
      key: input.key,
      enabled: input.enabled,
      description: input.description,
      scopeType,
      scopeValue,
    });
    await this.audit.append({
      actor: input.actor,
      action: "feature_flag_upsert",
      target: input.key,
      before: before ?? null,
      after: row,
      metadata: { scopeType, scopeValue },
    });
    const evaluated = await this.canonical.evaluate(input.key, input.evaluateAs ?? {});
    return { row, evaluated };
  }
}
