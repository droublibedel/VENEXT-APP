import { beforeEach, describe, expect, it } from "vitest";

import { resetBackofficeStore } from "../store/backoffice-store.js";
import { seedBackofficeFeatureFlags } from "../flags/backoffice-feature-flags.js";
import { runBackofficeOperationalHealthCheck } from "../health/operational-health-check.js";

beforeEach(() => {
  resetBackofficeStore();
  seedBackofficeFeatureFlags("development");
});

describe("backoffice-health-live", () => {
  it("includes governance_sync probe", async () => {
    const h = await runBackofficeOperationalHealthCheck({ bffOk: true, coreOk: true, governanceSyncOk: true });
    expect(h.components.governance_sync).toBeDefined();
  });

  it("marks bff down", async () => {
    const h = await runBackofficeOperationalHealthCheck({ bffOk: false, coreOk: true });
    expect(h.components.bff.status).toBe("down");
  });

  it("marks core down", async () => {
    const h = await runBackofficeOperationalHealthCheck({ bffOk: true, coreOk: false });
    expect(h.components.core.status).toBe("down");
  });

  it.each(["auth", "database", "messaging", "wallet_security", "notifications", "offline_sync"] as const)(
    "has component %s",
    async (key) => {
      const h = await runBackofficeOperationalHealthCheck();
      expect(h.components[key]).toBeDefined();
    },
  );

  it("checkedAt iso", async () => {
    const h = await runBackofficeOperationalHealthCheck();
    expect(h.checkedAt).toMatch(/^\d{4}-/);
  });
});
