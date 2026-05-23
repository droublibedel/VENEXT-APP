import { describe, expect, it } from "vitest";

import {
  buildWalletAccessContext,
  canSettleWithAccess,
  isWalletOwnerOnly,
} from "./commerce-wallet-access-bridge";

describe("commerce-wallet-access-bridge", () => {
  it("owner only", () => {
    const ctx = buildWalletAccessContext({
      organizationId: "org-b",
      actorRole: "grossiste_b",
      commerce_access_control_enabled: true,
    });
    expect(isWalletOwnerOnly(ctx)).toBe(true);
  });

  it("offline settlement forbidden", () => {
    const ctx = buildWalletAccessContext({
      organizationId: "org-b",
      connectivity: "OFFLINE",
      commerce_access_control_enabled: true,
    });
    expect(canSettleWithAccess(ctx)).toBe(false);
  });

  it("inactive relation settlement blocked", () => {
    const ctx = buildWalletAccessContext({
      organizationId: "org-b",
      relationshipStatus: "REMOVED",
      commerce_access_control_enabled: true,
    });
    expect(canSettleWithAccess(ctx)).toBe(false);
  });
});
