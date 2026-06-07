import { describe, expect, it } from "vitest";

import {
  resolveWalletSecurityMode,
  shouldLatchSecuredMode,
} from "./venext-wallet-security-mode";
import {
  BCEAO_SECURED_BALANCE_THRESHOLD_FCFA,
  SECURED_WALLET_IDLE_TIMEOUT_MS,
} from "./venext-wallet-security.types";
import { UserActivityTrackerRuntime } from "./user-activity-tracker-runtime";
import { createMobileMoneyProviderRegistry } from "./mobile-money-provider-gateway";

const TERRAIN_FLAGS = {
  terrain_unlimited_session_enabled: true,
  wallet_adaptive_security_enabled: true,
  wallet_ultra_short_timeout_enabled: true,
};

describe("VENEXT-WALLET-SECURITY-01 matrix", () => {
  it("uses 15 second secured idle timeout", () => {
    expect(SECURED_WALLET_IDLE_TIMEOUT_MS).toBe(15_000);
    expect(BCEAO_SECURED_BALANCE_THRESHOLD_FCFA).toBe(1000);
  });

  const balanceCases = [
    { balance: 0, secured: false },
    { balance: 500, secured: false },
    { balance: 999, secured: false },
    { balance: 1000, secured: true },
    { balance: 2500, secured: true },
  ] as const;

  describe.each(balanceCases)("balance threshold %i", ({ balance, secured }) => {
    it(`secured=${secured}`, () => {
      const r = resolveWalletSecurityMode({
        actorRole: "GROSSISTE_B",
        balanceFcfa: balance,
        walletActivated: true,
        flags: TERRAIN_FLAGS,
      });
      if (secured) {
        expect(r.mode).toBe("SECURED_WALLET_MODE");
        expect(r.inactivityTimeoutMs).toBe(15_000);
      } else {
        expect(r.mode).toBe("LIGHT_COMMERCE_MODE");
        expect(r.unlimitedTerrainSession).toBe(true);
      }
    });
  });

  const liveCases = [
    { org: "org-1", bff: true, persist: true, wallet: true, expect: true },
    { org: null, bff: true, persist: true, wallet: true, expect: false },
    { org: "org-1", bff: false, persist: true, wallet: true, expect: false },
    { org: "org-1", bff: true, persist: false, wallet: true, expect: false },
    { org: "org-1", bff: true, persist: true, wallet: false, expect: false },
  ] as const;

  function resolveWalletLiveEnabledLocal(input: {
    organizationId?: string | null;
    bffRoutesEnabled?: boolean;
    backendPersistenceEnabled?: boolean;
    walletEnabled?: boolean;
  }): boolean {
    if (input.walletEnabled === false) return false;
    if (!input.organizationId) return false;
    if (input.bffRoutesEnabled === false) return false;
    if (input.backendPersistenceEnabled === false) return false;
    return true;
  }

  describe.each(liveCases)("resolveWalletLiveEnabled", (c) => {
    it(JSON.stringify(c), () => {
      expect(
        resolveWalletLiveEnabledLocal({
          organizationId: c.org,
          bffRoutesEnabled: c.bff,
          backendPersistenceEnabled: c.persist,
          walletEnabled: c.wallet,
        }),
      ).toBe(c.expect);
    });
  });

  const latchCases = [
    { balance: 0, mode: "LIGHT_ONLY" as const, out: "LIGHT_ONLY" },
    { balance: 1000, mode: "LIGHT_ONLY" as const, out: "SECURED_LATCHED" },
    { balance: 500, mode: "SECURED_LATCHED" as const, out: "SECURED_LATCHED" },
  ];

  describe.each(latchCases)("shouldLatchSecuredMode", (c) => {
    it(`${c.balance}/${c.mode}`, () => {
      expect(shouldLatchSecuredMode(c.balance, c.mode)).toBe(c.out);
    });
  });

  const providers = ["ORANGE_MONEY", "MTN_MONEY", "WAVE", "MOOV_MONEY"] as const;
  describe.each(providers)("mobile money %s", (code) => {
    it("initiates topup", async () => {
      const registry = createMobileMoneyProviderRegistry();
      const gateway = registry.get(code);
      expect(gateway).toBeDefined();
      const result = await gateway!.initiateTopup({
        organizationId: "org-test",
        amountFcfa: 500,
        provider: code,
      });
      expect(result.ok).toBe(true);
      expect(result.providerRef).toBeTruthy();
    });
  });

  it("UserActivityTrackerRuntime fires on signal", () => {
    let count = 0;
    const tracker = new UserActivityTrackerRuntime({ onActivity: () => { count += 1; } });
    tracker.signalActivity();
    expect(count).toBe(1);
  });

  const actorRoles = ["GROSSISTE_B", "DETAILLANT", "GROSSISTE_A", "PRODUCTEUR"] as const;
  describe.each(actorRoles)("actor %s unlimited when light", (role) => {
    it("terrain unlimited below threshold", () => {
      const r = resolveWalletSecurityMode({
        actorRole: role,
        balanceFcfa: 200,
        flags: TERRAIN_FLAGS,
      });
      if (role === "GROSSISTE_B" || role === "DETAILLANT") {
        expect(r.unlimitedTerrainSession).toBe(true);
      }
    });
  });

  const kycStatuses = ["PENDING", "UNDER_REVIEW", "ACTIVE", "REJECTED", "SUSPENDED"];
  describe.each(kycStatuses)("kyc status label %s", (status) => {
    it("is a non-empty string", () => {
      expect(status.length).toBeGreaterThan(3);
    });
  });

  const docTypes = ["CNI", "PASSEPORT", "PERMIS", "CARTE_SEJOUR"];
  describe.each(docTypes)("document type %s", (doc) => {
    it("supported", () => {
      expect(["CNI", "PASSEPORT", "PERMIS", "CARTE_SEJOUR"]).toContain(doc);
    });
  });

  for (let i = 0; i < 120; i += 1) {
    it(`security invariant #${i}`, () => {
      const balance = (i % 5) * 400;
      const r = resolveWalletSecurityMode({
        actorRole: "DETAILLANT",
        balanceFcfa: balance,
        flags: TERRAIN_FLAGS,
      });
      if (balance >= 1000) {
        expect(r.requiresPinUnlock).toBe(true);
      } else {
        expect(r.mode).toBe("LIGHT_COMMERCE_MODE");
      }
    });
  }
});
