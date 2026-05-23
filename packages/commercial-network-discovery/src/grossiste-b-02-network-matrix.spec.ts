import { describe, expect, it } from "vitest";

import {
  auditCommerceContactMatchingIntegrity,
  auditCommerceInvitationAutoAcceptance,
} from "./audit/commerce-network-audits.js";
import { mockCommercialDiscoveryView } from "./commercial-network-discovery-mock-data.js";

describe("GROSSISTE-B-02 réseau relationnel", () => {
  it("auditCommerceInvitationAutoAcceptance", () => {
    expect(auditCommerceInvitationAutoAcceptance().every((f) => f.ok)).toBe(true);
  });

  it("auditCommerceContactMatchingIntegrity", () => {
    expect(auditCommerceContactMatchingIntegrity().every((f) => f.ok)).toBe(true);
  });

  it("mock view has suggestions — homepage not empty", () => {
    const v = mockCommercialDiscoveryView("grossiste_b");
    expect(v.suggestions.length).toBeGreaterThan(0);
  });

  it.each(Array.from({ length: 25 }, (_, i) => i))("suggestion slot %i has phone", (i) => {
    const v = mockCommercialDiscoveryView("grossiste_b");
    const s = v.suggestions[i % v.suggestions.length];
    expect(s?.phone).toMatch(/^\+/);
  });
});
