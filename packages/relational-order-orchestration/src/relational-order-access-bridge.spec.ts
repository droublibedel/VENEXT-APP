import { describe, expect, it } from "vitest";

import {
  buildOrderAccessContext,
  canCreateOrderWithAccess,
  canViewOrderWithAccess,
} from "./relational-order-access-bridge";

describe("relational-order-access-bridge", () => {
  const flags = { commerce_access_control_enabled: true };

  it("create with relation", () => {
    const ctx = buildOrderAccessContext({
      actorRole: "grossiste_b",
      organizationId: "org-b",
      relationshipId: "rel-1",
      flags,
    });
    expect(canCreateOrderWithAccess(ctx)).toBe(true);
  });

  it("read cross org blocked", () => {
    const ctx = buildOrderAccessContext({
      actorRole: "grossiste_b",
      organizationId: "org-x",
      buyerOrganizationId: "org-a",
      sellerOrganizationId: "org-b",
      flags,
    });
    expect(canViewOrderWithAccess(ctx, () => true)).toBe(false);
  });
});
