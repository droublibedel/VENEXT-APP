import { Injectable } from "@nestjs/common";
import { FeatureFlagScopeType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type CanonicalFlagInput = {
  organizationId?: string;
  /** Reserved for future RBAC layers */
  role?: string;
  country?: string;
  region?: string;
};

export type CanonicalFlagResult = {
  key: string;
  enabled: boolean;
  source: "ORGANIZATION" | "ROLE" | "REGION" | "COUNTRY" | "GLOBAL" | "UNKNOWN";
  evaluatedAt: string;
  scopeMatched: string | null;
};

/**
 * Single evaluation path for Prisma `feature_flag` rows (Instruction 9B).
 */
@Injectable()
export class CanonicalFeatureFlagEvaluator {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(key: string, input: CanonicalFlagInput = {}): Promise<CanonicalFlagResult> {
    const evaluatedAt = new Date().toISOString();
    const rows = await this.prisma.featureFlag.findMany({
      where: { key },
      orderBy: [{ scopeType: "asc" }],
    });
    if (rows.length === 0) {
      return {
        key,
        enabled: false,
        source: "UNKNOWN",
        evaluatedAt,
        scopeMatched: null,
      };
    }

    const org = input.organizationId
      ? rows.find((r) => r.scopeType === FeatureFlagScopeType.ORGANIZATION && r.scopeValue === input.organizationId)
      : undefined;
    if (org) {
      return {
        key,
        enabled: org.enabled,
        source: "ORGANIZATION",
        evaluatedAt,
        scopeMatched: input.organizationId ?? null,
      };
    }

    const role =
      input.role != null
        ? rows.find((r) => r.scopeType === FeatureFlagScopeType.ROLE && r.scopeValue === input.role)
        : undefined;
    if (role) {
      return {
        key,
        enabled: role.enabled,
        source: "ROLE",
        evaluatedAt,
        scopeMatched: input.role ?? null,
      };
    }

    const region = input.region
      ? rows.find(
          (r) =>
            (r.scopeType === FeatureFlagScopeType.REGION || r.scopeType === FeatureFlagScopeType.COUNTRY) &&
            r.scopeValue === input.region,
        )
      : undefined;
    if (region) {
      return {
        key,
        enabled: region.enabled,
        source: region.scopeType === FeatureFlagScopeType.COUNTRY ? "COUNTRY" : "REGION",
        evaluatedAt,
        scopeMatched: input.region ?? null,
      };
    }

    const country = input.country
      ? rows.find(
          (r) =>
            (r.scopeType === FeatureFlagScopeType.COUNTRY || r.scopeType === FeatureFlagScopeType.REGION) &&
            r.scopeValue === input.country,
        )
      : undefined;
    if (country) {
      return {
        key,
        enabled: country.enabled,
        source: "COUNTRY",
        evaluatedAt,
        scopeMatched: input.country ?? null,
      };
    }

    const global = rows.find((r) => r.scopeType === FeatureFlagScopeType.GLOBAL);
    return {
      key,
      enabled: global?.enabled ?? false,
      source: "GLOBAL",
      evaluatedAt,
      scopeMatched: global ? "" : null,
    };
  }

  /** Production: unknown key → false. Non-prod: false (explicit flags only). */
  async isEnabled(key: string, input: CanonicalFlagInput = {}): Promise<boolean> {
    return (await this.evaluate(key, input)).enabled;
  }
}
