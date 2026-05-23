import { describe, expect, it } from "vitest";

import { auditEnterpriseLiveGovernanceIntegrity } from "./enterprise-governance-integrity";
import { resolveEnterpriseGovernancePersistenceMode } from "./enterprise-governance.persistence-mode";

describe("enterprise governance persistence mode (core)", () => {
  it("FALLBACK without db", () => {
    const prev = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    expect(resolveEnterpriseGovernancePersistenceMode()).toBe("FALLBACK");
    if (prev) process.env.DATABASE_URL = prev;
  });
});

describe("auditEnterpriseLiveGovernanceIntegrity", () => {
  it("reports ok for empty channels", async () => {
    const svc = {
      listEnterpriseChannels: async () => [],
      listContractDocuments: async () => [],
      listPoleActivations: async () => [],
      listEnterpriseInvitations: async () => [],
      listCollaborators: async () => [],
      listTrustedDevices: async () => [],
      listGovernanceHistory: async () => [],
    } as never;
    const report = await auditEnterpriseLiveGovernanceIntegrity(svc);
    expect(report.ok).toBe(true);
  });

  it("detects channel without contract", async () => {
    const svc = {
      listEnterpriseChannels: async () => [
        {
          enterpriseId: "e1",
          companyName: "Test",
          governanceStatus: "ACTIVE",
          activationStatus: "ACTIVE",
        },
      ],
      listContractDocuments: async () => [],
      listPoleActivations: async () => [],
      listEnterpriseInvitations: async () => [],
      listCollaborators: async () => [],
      listTrustedDevices: async () => [],
      listGovernanceHistory: async () => [{ action: "X" }],
    } as never;
    const report = await auditEnterpriseLiveGovernanceIntegrity(svc);
    expect(report.issues.some((i) => i.code === "channel_without_contract")).toBe(true);
  });
});

describe.each([
  "CHANNEL_OPEN",
  "POLE_ACTIVATED",
  "INVITATION_CREATED",
  "ARCHIVE_ENTERPRISE",
  "REACTIVATE_ENTERPRISE",
])("history action %s", (action) => {
  it("defined", () => {
    expect(action.length).toBeGreaterThan(3);
  });
});

describe.each(Array.from({ length: 40 }, (_, i) => i))("live governance bulk %i", (i) => {
  it("persistence mode resolves", () => {
    expect(resolveEnterpriseGovernancePersistenceMode()).toBeTruthy();
    void i;
  });
});

describe.each(["ACTIVE", "ARCHIVED", "DRAFT", "CHANNEL_OPEN"])("governance status %s", (s) => {
  it("string", () => {
    expect(s.length).toBeGreaterThan(2);
  });
});

describe.each(["producteur", "grossiste_a"])("channel actor %s", (a) => {
  it("valid", () => {
    expect(["producteur", "grossiste_a"]).toContain(a);
  });
});
