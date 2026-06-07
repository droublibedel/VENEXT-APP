import { describe, expect, it } from "vitest";

import { resolveWalletLiveEnabled } from "./resolve-wallet-live-enabled";

describe("resolveWalletLiveEnabled", () => {
  const cases = [
    { org: "org-1", bff: true, persist: true, wallet: true, expect: true },
    { org: null, bff: true, persist: true, wallet: true, expect: false },
    { org: "org-1", bff: false, persist: true, wallet: true, expect: false },
  ] as const;

  it.each(cases)("%j", (c) => {
    expect(
      resolveWalletLiveEnabled({
        organizationId: c.org,
        bffRoutesEnabled: c.bff,
        backendPersistenceEnabled: c.persist,
        walletEnabled: c.wallet,
      }),
    ).toBe(c.expect);
  });
});
