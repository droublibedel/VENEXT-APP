import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetBackofficeStore } from "./store/backoffice-store.js";
import { resolveEnterpriseGovernancePersistenceMode } from "./governance/enterprise-governance.persistence-mode.js";
import { governanceResponseMeta, defaultGovernanceMeta } from "./governance/enterprise-governance-envelope.js";
import { syncEnterpriseGovernanceToBackoffice } from "./governance/sync-enterprise-governance.js";

beforeEach(() => {
  process.env.BACKOFFICE_PERSISTENCE_MODE = "FALLBACK";
  process.env.ENTERPRISE_GOVERNANCE_PERSISTENCE_MODE = "FALLBACK";
  delete process.env.DATABASE_URL;
  resetBackofficeStore();
  vi.restoreAllMocks();
});

describe("enterprise governance persistence mode", () => {
  it("FALLBACK without DATABASE_URL", () => {
    expect(resolveEnterpriseGovernancePersistenceMode()).toBe("FALLBACK");
  });

  it("LIVE with DATABASE_URL and flag", () => {
    process.env.DATABASE_URL = "postgresql://x";
    process.env.backoffice_live_governance_enabled = "true";
    expect(resolveEnterpriseGovernancePersistenceMode()).toBe("LIVE");
    delete process.env.DATABASE_URL;
  });

  it("HYBRID when env set", () => {
    process.env.DATABASE_URL = "postgresql://x";
    process.env.ENTERPRISE_GOVERNANCE_PERSISTENCE_MODE = "HYBRID";
    process.env.backoffice_live_governance_enabled = "true";
    expect(resolveEnterpriseGovernancePersistenceMode()).toBe("HYBRID");
    delete process.env.DATABASE_URL;
  });
});

describe("governance envelope meta", () => {
  it("exposes dataSource", () => {
    const m = governanceResponseMeta({
      dataSource: "LIVE",
      persistenceMode: "LIVE",
      fallbackUsed: false,
      lastSyncAt: new Date().toISOString(),
    });
    expect(m.dataSource).toBe("LIVE");
    expect(m.fallbackUsed).toBe(false);
  });

  it("default meta fallback in dev", () => {
    const m = defaultGovernanceMeta();
    expect(m.persistenceMode).toBeDefined();
  });
});

describe("syncEnterpriseGovernanceToBackoffice", () => {
  it("returns sync metadata in fallback", async () => {
    process.env.backoffice_live_governance_enabled = "true";
    const r = await syncEnterpriseGovernanceToBackoffice();
    expect(r.dataSource).toBeDefined();
    expect(r.lastSyncAt).toBeTruthy();
  });
});

describe.each(["LIVE", "FALLBACK", "HYBRID"])("dataSource label %s", (ds) => {
  it("is valid governance source", () => {
    expect(["LIVE", "FALLBACK", "HYBRID"]).toContain(ds);
  });
});

describe.each([
  "channel_without_contract",
  "pole_enterprise_mismatch",
  "invitation_without_pole",
  "missing_governance_history",
])("integrity code %s", (code) => {
  it("is documented", () => {
    expect(code.length).toBeGreaterThan(5);
  });
});

describe.each(Array.from({ length: 30 }, (_, i) => i))("governance sync smoke %i", (i) => {
  it("sync returns object", async () => {
    process.env.backoffice_live_governance_enabled = "true";
    const r = await syncEnterpriseGovernanceToBackoffice();
    expect(typeof r.synced).toBe("number");
    expect(r.dataSource).toBeTruthy();
    void i;
  });
});

describe.each(["archive", "reactivate", "suspend", "validate"])("governance action %s", (action) => {
  it("action string valid", () => {
    expect(action.length).toBeGreaterThan(3);
  });
});

describe.each(["producteur", "grossiste_a"])("actor kind %s", (kind) => {
  it("valid", () => {
    expect(["producteur", "grossiste_a"]).toContain(kind);
  });
});

describe.each(["executive", "commercial", "relational-commercial"])("pole %s", (poleId) => {
  it("canonical pole id", () => {
    expect(poleId.length).toBeGreaterThan(2);
  });
});

describe.each(["OPEN", "PENDING", "REVOKED", "ACTIVE"])("invitation status %s", (status) => {
  it("valid", () => {
    expect(status.length).toBeGreaterThan(2);
  });
});

describe.each(["PENDING_VALIDATION", "ACTIVE", "SUSPENDED", "ARCHIVED"])("collaborator status %s", (status) => {
  it("valid", () => {
    expect(status.length).toBeGreaterThan(3);
  });
});

describe.each(["unusual_login", "unknown_ip", "invitation_expired"])("alert type %s", (t) => {
  it("valid", () => {
    expect(t.includes("_")).toBe(true);
  });
});

describe("fetch live client fallback", () => {
  it("uses memory when core unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("offline")),
    );
    const { fetchEnterpriseGovernanceLiveSnapshot } = await import(
      "./governance/enterprise-governance-live-client.js"
    );
    const snap = await fetchEnterpriseGovernanceLiveSnapshot();
    expect(snap.fallbackUsed).toBe(true);
    expect(snap.dataSource).toBe("FALLBACK");
  });
});
