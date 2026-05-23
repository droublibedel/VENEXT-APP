import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import {
  assertEnterpriseGovernanceRouteIsLive,
  enterpriseGovernanceRouteMeta,
  resetEnterpriseGovernanceLegacyWarningsForTests,
  resolveEnterpriseGovernanceApiRoute,
  warnEnterpriseGovernanceLegacyRoute,
} from "./enterprise-governance-api-contract";
import {
  canRunSensitiveGovernancePanelAction,
  fetchEnterpriseChannelsForPanel,
  fetchEnterpriseSecurityAlertsForPanel,
  sensitiveActionUnavailableMessage,
} from "./enterprise-governance-live-ui-client";
import { patchEnterpriseChannelStatusFromPanel } from "./enterprise-governance-live-panel-actions";
import { shouldForceEnterpriseGovernanceMemoryFallback } from "./enterprise-governance-ui.persistence-mode";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function auditNoDirectEnterpriseMemoryStoreInPanels(): {
  ok: boolean;
  violations: Array<{ file: string; line: string }>;
} {
  const dir = import.meta.dirname;
  const violations: Array<{ file: string; line: string }> = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".tsx") || name.includes(".spec.")) continue;
    const content = readFileSync(join(dir, name), "utf8");
    if (content.includes("enterprise-governance-storage")) {
      violations.push({ file: name, line: "enterprise-governance-storage" });
    }
  }
  return { ok: violations.length === 0, violations };
}
import { EnterpriseGovernanceDataSourceBadge } from "./EnterpriseGovernanceDataSourceBadge";
import { EnterpriseGlobalGovernanceControlPanel } from "./EnterpriseGlobalGovernanceControlPanel";
import { resetEnterpriseGovernanceStorage, createEnterpriseChannel } from "./enterprise-governance-storage";

beforeEach(() => {
  resetEnterpriseGovernanceStorage();
  resetEnterpriseGovernanceLegacyWarningsForTests();
  createEnterpriseChannel({
    enterpriseId: "ent-01c",
    actorKind: "producteur",
    contractReference: "C-01",
    companyName: "Test 01C",
    headquarters: "Abidjan",
    governanceStatus: "ACTIVE",
    activationStatus: "ACTIVE",
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delete process.env.ENTERPRISE_GOVERNANCE_UI_LIVE_TESTS;
  delete process.env.ENTERPRISE_GOVERNANCE_UI_FORCE_FALLBACK;
});

describe("API contract", () => {
  it.each([
    "channels_list",
    "channel_detail",
    "channel_poles",
    "channel_invitations",
    "channel_collaborators",
    "channel_security_alerts",
    "channel_timeline",
    "channel_status_patch",
  ] as const)("live route %s resolves", (kind) => {
    const path = resolveEnterpriseGovernanceApiRoute(kind, { enterpriseId: "ent-1" });
    expect(path).toContain("/commerce-foundation/enterprise/");
    expect(() => assertEnterpriseGovernanceRouteIsLive(kind)).not.toThrow();
    expect(enterpriseGovernanceRouteMeta(kind).status).toBe("SOURCE_OF_TRUTH");
  });

  it.each([
    "legacy_activation_queue",
    "legacy_security_actions",
    "legacy_security_history",
    "legacy_security_alerts_query",
  ] as const)("legacy route %s marked compatibility", (kind) => {
    expect(enterpriseGovernanceRouteMeta(kind).family).toBe("LEGACY_COMMERCE_FOUNDATION");
  });

  it("legacy route warns in dev", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnEnterpriseGovernanceLegacyRoute("legacy_security_actions");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("live UI client fallback", () => {
  it("uses memory fallback in test env", async () => {
    expect(shouldForceEnterpriseGovernanceMemoryFallback()).toBe(true);
    const env = await fetchEnterpriseChannelsForPanel();
    expect(env.fallbackUsed).toBe(true);
    expect(env.dataSource).toBe("FALLBACK");
    expect(env.data.length).toBeGreaterThan(0);
  });

  it("security alerts fallback explicit", async () => {
    const env = await fetchEnterpriseSecurityAlertsForPanel("ent-01c");
    expect(env.fallbackUsed).toBe(true);
    expect(Array.isArray(env.data)).toBe(true);
  });

  it.each([0, 1])("channels panel envelope shape %i", async (i) => {
    const env = await fetchEnterpriseChannelsForPanel();
    expect(env.lastSyncAt).toBeTruthy();
    expect(env.data.length).toBeGreaterThanOrEqual(i);
  });
});

describe("sensitive actions", () => {
  it("disabled when fallback", () => {
    expect(canRunSensitiveGovernancePanelAction({ dataSource: "FALLBACK", fallbackUsed: true })).toBe(false);
  });

  it("enabled when live", () => {
    expect(canRunSensitiveGovernancePanelAction({ dataSource: "LIVE", fallbackUsed: false })).toBe(true);
  });

  it("patch blocked in fallback", async () => {
    const r = await patchEnterpriseChannelStatusFromPanel("ent-01c", "archive", "note longue", {
      dataSource: "FALLBACK",
      fallbackUsed: true,
    });
    expect(r.ok).toBe(false);
    expect(r.requiresLive).toBe(true);
  });

  it("message for unavailable action", () => {
    expect(sensitiveActionUnavailableMessage()).toContain("persistance");
  });
});

describe("panels", () => {
  it("renders global panel with fallback badge", async () => {
    render(<EnterpriseGlobalGovernanceControlPanel />);
    expect(await screen.findByTestId("enterprise-global-governance-panel")).toBeTruthy();
    expect(screen.getByTestId("enterprise-governance-source-badge").textContent).toContain("secours");
  });

  it("shows live required message when fallback", async () => {
    render(<EnterpriseGlobalGovernanceControlPanel />);
    expect((await screen.findAllByTestId("global-governance-live-required")).length).toBeGreaterThan(0);
  });

  it("disables sensitive buttons in fallback", async () => {
    render(<EnterpriseGlobalGovernanceControlPanel />);
    await screen.findByTestId("enterprise-global-governance-panel");
    const buttons = await screen.findAllByTestId("global-suspend-enterprise");
    expect((buttons[0] as HTMLButtonElement).disabled).toBe(true);
  });

  it("DataSourceBadge fallback text", () => {
    render(<EnterpriseGovernanceDataSourceBadge dataSource="FALLBACK" fallbackUsed />);
    expect(screen.getAllByText(/Données locales de secours/).length).toBeGreaterThan(0);
  });

  it("DataSourceBadge live text", () => {
    render(<EnterpriseGovernanceDataSourceBadge dataSource="LIVE" />);
    expect(screen.getAllByText(/Source LIVE/).length).toBeGreaterThan(0);
  });
});

describe("import audit", () => {
  it("no direct storage import in Enterprise panels", () => {
    const audit = auditNoDirectEnterpriseMemoryStoreInPanels();
    expect(audit.ok).toBe(true);
    if (!audit.ok) {
      throw new Error(JSON.stringify(audit.violations));
    }
  });
});

describe("live fetch success path", () => {
  it("marks LIVE when core responds", async () => {
    const prevLive = process.env.ENTERPRISE_GOVERNANCE_UI_LIVE_TESTS;
    const prevFb = process.env.ENTERPRISE_GOVERNANCE_UI_FORCE_FALLBACK;
    process.env.ENTERPRISE_GOVERNANCE_UI_LIVE_TESTS = "1";
    process.env.ENTERPRISE_GOVERNANCE_UI_FORCE_FALLBACK = "0";
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            payload: [{ enterpriseId: "live-1", companyName: "Live Co" }],
            dataSource: "LIVE",
            fallbackUsed: false,
          }),
        }),
      ),
    );
    const env = await fetchEnterpriseChannelsForPanel();
    expect(env.dataSource).toBe("LIVE");
    expect(env.fallbackUsed).toBe(false);
    expect((env.data[0] as { enterpriseId: string }).enterpriseId).toBe("live-1");
    process.env.ENTERPRISE_GOVERNANCE_UI_LIVE_TESTS = prevLive;
    process.env.ENTERPRISE_GOVERNANCE_UI_FORCE_FALLBACK = prevFb;
  });
});

describe("route path shapes", () => {
  it.each(Array.from({ length: 12 }, (_, i) => i))("detail path includes id %i", (i) => {
    const p = resolveEnterpriseGovernanceApiRoute("channel_detail", { enterpriseId: `e-${i}` });
    expect(p).toContain(`e-${i}`);
  });
});

describe("envelope invariants", () => {
  it.each(Array.from({ length: 20 }, (_, i) => `ent-${i}`))("channel detail fallback for %s", async (id) => {
    const { fetchEnterpriseChannelDetailForPanel } = await import("./enterprise-governance-live-ui-client.js");
    const env = await fetchEnterpriseChannelDetailForPanel(id);
    expect(env.fallbackUsed).toBe(true);
    expect(env.lastSyncAt).toMatch(/^\d{4}-/);
  });

  it.each(["LIVE", "FALLBACK", "HYBRID"] as const)("canRunSensitive %s", (ds) => {
    const enabled = canRunSensitiveGovernancePanelAction({
      dataSource: ds,
      fallbackUsed: ds !== "LIVE",
    });
    if (ds === "LIVE") expect(enabled).toBe(true);
    else expect(enabled).toBe(false);
  });
});
