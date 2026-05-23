import { describe, expect, it, vi } from "vitest";
import { FeatureFlagScopeType, OrganizationVerificationStatus, RelationshipStatus } from "@prisma/client";
import { BackofficeDataQualityService } from "./backoffice-data-quality/backoffice-data-quality.service";
import { BackofficeFeatureControlService } from "./backoffice-feature-control/backoffice-feature-control.service";
import { BackofficeEcosystemService } from "./backoffice-ecosystem/backoffice-ecosystem.service";
import { BackofficeSponsoredGovernanceService } from "./backoffice/backoffice-sponsored-governance.service";
import { BackofficeCommandCenterService } from "./backoffice/backoffice-command-center.service";
import { BackofficeAuditLogService } from "./backoffice-audit-log/backoffice-audit-log.service";
import { BackofficeAiGatewayService } from "./backoffice/backoffice-ai-gateway.service";
import { BackofficeGraphSupervisionService } from "./backoffice-graph-supervision/backoffice-graph-supervision.service";

describe("Instruction 10A — data quality duplicate commercialId", () => {
  it("emits COMMERCIAL_ID_DUPLICATE when SQL finds collisions", async () => {
    const prisma = {
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([{ commercialId: "dup", cnt: 2n }])
        .mockResolvedValueOnce([]),
      organization: { count: vi.fn().mockResolvedValue(0) },
      relationship: { count: vi.fn().mockResolvedValue(0) },
      product: { count: vi.fn().mockResolvedValue(0) },
      productVisibility: { count: vi.fn().mockResolvedValue(0) },
      sponsoredProductInjection: { count: vi.fn().mockResolvedValue(0) },
      featureFlag: { findFirst: vi.fn().mockResolvedValue({}) },
    };
    const svc = new BackofficeDataQualityService(prisma as never);
    const out = await svc.runScan();
    expect(out.findings.some((f) => f.code === "COMMERCIAL_ID_DUPLICATE")).toBe(true);
  });
});

describe("Instruction 10A — PATCH audit hooks", () => {
  it("feature_flag_upsert calls audit append", async () => {
    const append = vi.fn().mockResolvedValue({});
    const audit = { append } as unknown as BackofficeAuditLogService;
    const prisma = {
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn(),
      },
    };
    const flags = {
      upsertRuntime: vi.fn().mockResolvedValue({ id: "f1", key: "wallet_enabled", enabled: true }),
    };
    const canonical = {
      evaluate: vi.fn().mockResolvedValue({ enabled: true, source: "GLOBAL" }),
    };
    const svc = new BackofficeFeatureControlService(prisma as never, flags as never, canonical as never, audit);
    await svc.patchFlag({
      actor: "u1",
      key: "wallet_enabled",
      enabled: true,
      scopeType: FeatureFlagScopeType.GLOBAL,
      scopeValue: "",
    });
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({ action: "feature_flag_upsert", target: "wallet_enabled" }),
    );
  });

  it("organization patch writes audit", async () => {
    const append = vi.fn().mockResolvedValue({});
    const audit = { append } as unknown as BackofficeAuditLogService;
    const prisma = {
      organization: {
        findUnique: vi.fn().mockResolvedValue({ id: "o1", verificationStatus: "UNVERIFIED" }),
        update: vi.fn().mockResolvedValue({ id: "o1", verificationStatus: "VERIFIED" }),
      },
    };
    const canonical = { evaluate: vi.fn() };
    const svc = new BackofficeEcosystemService(prisma as never, canonical as never, audit);
    await svc.patchOrganization("actor", "o1", { verificationStatus: OrganizationVerificationStatus.VERIFIED });
    expect(append).toHaveBeenCalledWith(expect.objectContaining({ action: "organization_governance_patch", target: "o1" }));
  });

  it("sponsored governance patch writes audit", async () => {
    const append = vi.fn().mockResolvedValue({});
    const audit = { append } as unknown as BackofficeAuditLogService;
    const prisma = {
      sponsoredProductInjection: {
        findUnique: vi.fn().mockResolvedValue({
          id: "i1",
          governanceState: {},
          sponsorOrganizationId: "s1",
          active: true,
        }),
        update: vi.fn().mockResolvedValue({ id: "i1", active: false }),
      },
    };
    const canonical = { evaluate: vi.fn().mockResolvedValue({ enabled: true }) };
    const injectionEngine = { listActiveInjections: vi.fn() };
    const svc = new BackofficeSponsoredGovernanceService(prisma as never, canonical as never, injectionEngine as never, audit);
    await svc.patchInjection("actor", "i1", { action: "pause", note: "t" });
    expect(append).toHaveBeenCalledWith(expect.objectContaining({ action: "sponsored_injection_governance", target: "i1" }));
  });

  it("relationship patch writes audit", async () => {
    const append = vi.fn().mockResolvedValue({});
    const audit = { append } as unknown as BackofficeAuditLogService;
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({ id: "r1", status: RelationshipStatus.ACCEPTED }),
        update: vi.fn().mockResolvedValue({ id: "r1", status: RelationshipStatus.SUSPENDED }),
      },
    };
    const svc = new BackofficeGraphSupervisionService(prisma as never, audit);
    await svc.patchRelationship("actor", "r1", { status: RelationshipStatus.SUSPENDED });
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({ action: "relationship_status_change", target: "r1" }),
    );
  });
});

describe("Instruction 10A — overview structure", () => {
  it("includes meta, networkVitality, featureSurfaceStatus", async () => {
    const prisma = {
      organization: { count: vi.fn().mockResolvedValue(1) },
      relationship: { count: vi.fn().mockResolvedValue(0) },
      featureFlag: { count: vi.fn().mockResolvedValue(3) },
      economicSignal: { count: vi.fn().mockResolvedValue(0) },
      sponsoredProductInjection: { count: vi.fn().mockResolvedValue(0) },
      backofficeAuditLog: { count: vi.fn().mockResolvedValue(0) },
    };
    const canonical = {
      evaluate: vi.fn().mockResolvedValue({ enabled: true, source: "GLOBAL", key: "k", evaluatedAt: "", scopeMatched: null }),
    };
    const dq = {
      runScan: vi.fn().mockResolvedValue({ findings: [], summary: { totalFindings: 0, high: 0 } }),
    };
    const ai = new BackofficeAiGatewayService({ append: vi.fn() } as never);
    const svc = new BackofficeCommandCenterService(prisma as never, canonical as never, dq as never, ai);
    const out = await svc.overview();
    expect(out.meta?.nodeEnv).toBeDefined();
    expect(out.networkVitality).toBeDefined();
    expect(out.featureSurfaceStatus?.canonicalSamples).toBeDefined();
  });
});
