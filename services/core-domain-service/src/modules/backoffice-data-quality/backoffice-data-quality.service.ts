import { Injectable } from "@nestjs/common";
import { FeatureFlagScopeType, OrganizationVerificationStatus, RelationshipStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { BACKOFFICE_GOVERNED_FLAG_KEYS } from "../backoffice/governance-keys";

export type DataQualityFinding = {
  code: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  count: number;
  detail: string;
  recommendedAction?: string;
};

@Injectable()
export class BackofficeDataQualityService {
  constructor(private readonly prisma: PrismaService) {}

  async runScan() {
    const findings: DataQualityFinding[] = [];

    const dupCommercialRows = await this.prisma.$queryRaw<{ commercialId: string; cnt: bigint }[]>`
      SELECT "commercialId", COUNT(*)::bigint as cnt
      FROM organizations
      GROUP BY "commercialId"
      HAVING COUNT(*) > 1
    `;
    if (dupCommercialRows.length > 0) {
      findings.push({
        code: "COMMERCIAL_ID_DUPLICATE",
        severity: "HIGH",
        count: dupCommercialRows.length,
        detail: `${dupCommercialRows.length} commercialId value(s) collide across organizations — integrity breach.`,
        recommendedAction: "Resolve collisions in DB or merge duplicate org rows before commerce flows.",
      });
    }

    const orgMeta = await this.prisma.organization.count({
      where: { OR: [{ legalName: null }, { address: null }, { commune: null }] },
    });
    if (orgMeta > 0) {
      findings.push({
        code: "ORG_METADATA_INCOMPLETE",
        severity: "MEDIUM",
        count: orgMeta,
        detail: "Organizations missing legalName, address, or commune (commercial depth risk).",
        recommendedAction: "Complete legal profile fields for downstream governance.",
      });
    }

    const unverifiedActive = await this.prisma.organization.count({
      where: {
        verificationStatus: OrganizationVerificationStatus.UNVERIFIED,
        governanceSuspended: false,
        credibilityScore: { gte: 0.75 },
      },
    });
    if (unverifiedActive > 0) {
      findings.push({
        code: "CREDIBILITY_VERIFICATION_MISMATCH",
        severity: "HIGH",
        count: unverifiedActive,
        detail: "High credibility score but organization still UNVERIFIED.",
        recommendedAction: "Verify or downgrade credibility in governance review.",
      });
    }

    const weakRelMeta = await this.prisma.relationship.count({
      where: { commerceCategory: "", status: { in: [RelationshipStatus.ACCEPTED, RelationshipStatus.PENDING] } },
    });
    if (weakRelMeta > 0) {
      findings.push({
        code: "RELATIONSHIP_METADATA_WEAK",
        severity: "MEDIUM",
        count: weakRelMeta,
        detail: "Accepted or pending relationships with empty commerceCategory.",
      });
    }

    const orphanishProducts = await this.prisma.product.count({
      where: { active: true, visibility: { none: {} } },
    });
    if (orphanishProducts > 0) {
      findings.push({
        code: "PRODUCTS_WITHOUT_VISIBILITY",
        severity: "MEDIUM",
        count: orphanishProducts,
        detail: "Active products with zero visibility rows (unscoped to relationships).",
      });
    }

    const visibilityAnomaly = await this.prisma.productVisibility.count({
      where: {
        active: true,
        visibleToRelationshipId: { not: null },
        visibleToRelationship: { status: { not: RelationshipStatus.ACCEPTED } },
      },
    });
    if (visibilityAnomaly > 0) {
      findings.push({
        code: "VISIBILITY_NON_ACCEPTED_EDGE",
        severity: "HIGH",
        count: visibilityAnomaly,
        detail: "Active product visibility bound to a relationship that is not ACCEPTED.",
      });
    }

    const unverifiedSponsorInj = await this.prisma.sponsoredProductInjection.count({
      where: {
        active: true,
        sponsor: { verificationStatus: OrganizationVerificationStatus.UNVERIFIED },
      },
    });
    if (unverifiedSponsorInj > 0) {
      findings.push({
        code: "SPONSORED_INJECTION_UNVERIFIED_SPONSOR",
        severity: "MEDIUM",
        count: unverifiedSponsorInj,
        detail: "Active sponsored injections where sponsor organization is not VERIFIED.",
        recommendedAction: "Pause injection or verify sponsor org.",
      });
    }

    const governedKeys = [...BACKOFFICE_GOVERNED_FLAG_KEYS];
    const missingGlobal: string[] = [];
    for (const key of governedKeys) {
      const g = await this.prisma.featureFlag.findFirst({
        where: { key, scopeType: FeatureFlagScopeType.GLOBAL, scopeValue: "" },
      });
      if (!g) missingGlobal.push(key);
    }
    if (missingGlobal.length > 0) {
      findings.push({
        code: "FEATURE_FLAG_GOVERNANCE_GAP",
        severity: "MEDIUM",
        count: missingGlobal.length,
        detail: `Governed keys without GLOBAL row: ${missingGlobal.slice(0, 8).join(", ")}${missingGlobal.length > 8 ? "…" : ""}`,
        recommendedAction: "Seed or upsert GLOBAL scope rows for governed keys.",
      });
    }

    const inconsistentPairs = await this.prisma.$queryRaw<{ key: string; scope_type: string; scope_value: string; n: bigint }[]>`
      SELECT key, "scopeType" as scope_type, "scopeValue" as scope_value, COUNT(*)::bigint as n
      FROM feature_flags
      GROUP BY key, "scopeType", "scopeValue"
      HAVING COUNT(*) > 1
    `;
    if (inconsistentPairs.length > 0) {
      findings.push({
        code: "FEATURE_FLAG_DUPLICATE_ROWS",
        severity: "HIGH",
        count: inconsistentPairs.length,
        detail: "Duplicate feature_flag rows for same key+scope (schema breach).",
        recommendedAction: "Run DB cleanup / enforce unique constraint migration.",
      });
    }

    return {
      findings,
      generatedAt: new Date().toISOString(),
      summary: {
        totalFindings: findings.length,
        high: findings.filter((f) => f.severity === "HIGH").length,
      },
    };
  }
}
