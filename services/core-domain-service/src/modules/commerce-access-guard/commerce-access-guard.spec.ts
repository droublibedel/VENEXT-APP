import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { MESSAGING_SUSPENDED_UX, resetCommerceAccessTestState } from "commerce-access-control";

import { CommerceAccessGuardService } from "./commerce-access-guard.service";

describe("CommerceAccessGuardService 20.83-A", () => {
  const guard = new CommerceAccessGuardService();

  beforeEach(() => {
    resetCommerceAccessTestState();
  });

  afterEach(() => {
    resetCommerceAccessTestState();
  });

  it("blocks catalog without relationship", () => {
    expect(() => guard.assertCatalogAccess(undefined, "org")).toThrow(ForbiddenException);
  });

  it("blocks inactive relation", () => {
    expect(() => guard.assertRelationshipActive("rel-1", "REMOVED")).toThrow(ForbiddenException);
  });

  it("wallet owner match", () => {
    expect(() => guard.assertWalletAccess("org-b", "org-b")).not.toThrow();
  });

  it("wallet cross org", () => {
    expect(() => guard.assertWalletAccess("org-x", "org-b")).toThrow(ForbiddenException);
  });

  it("messaging suspended", () => {
    try {
      guard.assertMessagingAccess({
        organizationId: "org-b",
        relationshipId: "rel-1",
        participantStatus: "SUSPENDED",
      });
      expect.fail("expected ForbiddenException");
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenException);
      const response = (e as ForbiddenException).getResponse();
      const userMessage =
        typeof response === "object" && response !== null && "userMessage" in response
          ? String((response as { userMessage: string }).userMessage)
          : String(response);
      expect(userMessage).toBe(MESSAGING_SUSPENDED_UX);
    }
  });

  it("order parties outsider", () => {
    expect(() =>
      guard.assertOrderParties("org-x", "org-a", "org-b", undefined),
    ).toThrow(ForbiddenException);
  });
});
