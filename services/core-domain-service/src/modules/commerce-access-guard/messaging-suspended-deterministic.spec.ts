import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import {
  MESSAGING_SUSPENDED_UX,
  resetCommerceAccessTestState,
} from "commerce-access-control";

import { CommerceAccessGuardService } from "./commerce-access-guard.service";
import { assertMessagingAccess } from "./messaging-access-guard";

describe("core messaging suspended deterministic 20.86-E1", () => {
  const guard = new CommerceAccessGuardService();

  beforeEach(() => {
    resetCommerceAccessTestState();
  });

  afterEach(() => {
    resetCommerceAccessTestState();
  });

  function expectSuspendedBlocked(fn: () => void): void {
    try {
      fn();
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenException);
      const response = (e as ForbiddenException).getResponse();
      const userMessage =
        typeof response === "object" && response !== null && "userMessage" in response
          ? String((response as { userMessage: string }).userMessage)
          : String(response);
      expect(userMessage).toBe(MESSAGING_SUSPENDED_UX);
      expect(userMessage).not.toMatch(/forbidden|unauthorized/i);
    }
  }

  it("commerce-access-guard messaging suspended", () => {
    expectSuspendedBlocked(() =>
      guard.assertMessagingAccess({
        organizationId: "org-b",
        relationshipId: "rel-1",
        participantStatus: "SUSPENDED",
      }),
    );
  });

  it("assertMessagingAccess pipeline", () => {
    expectSuspendedBlocked(() =>
      assertMessagingAccess({
        organizationId: "org-b",
        relationshipId: "rel-1",
        participantStatus: "SUSPENDED",
      }),
    );
  });

  it("formal mail suspended", () => {
    expectSuspendedBlocked(() =>
      assertMessagingAccess({
        organizationId: "org-p",
        relationshipId: "rel-1",
        participantStatus: "SUSPENDED",
        formal: true,
      }),
    );
  });

  it("500 stress suspended always blocked", () => {
    for (let i = 0; i < 500; i += 1) {
      expectSuspendedBlocked(() =>
        guard.assertMessagingAccess({
          organizationId: "org-b",
          relationshipId: "rel-1",
          participantStatus: "SUSPENDED",
        }),
      );
    }
  });

  it("parallel 50 suspended blocks", async () => {
    await Promise.all(
      Array.from({ length: 50 }, async () => {
        expectSuspendedBlocked(() =>
          assertMessagingAccess({
            organizationId: "org-b",
            relationshipId: "rel-1",
            participantStatus: "SUSPENDED",
          }),
        );
      }),
    );
  });

  it("active then suspended order independent", () => {
    expect(() =>
      guard.assertMessagingAccess({
        organizationId: "org-b",
        relationshipId: "rel-1",
        participantStatus: "ACTIVE",
      }),
    ).not.toThrow();
    expectSuspendedBlocked(() =>
      guard.assertMessagingAccess({
        organizationId: "org-b",
        relationshipId: "rel-1",
        participantStatus: "SUSPENDED",
      }),
    );
  });
});
