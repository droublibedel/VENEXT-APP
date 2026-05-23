import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { commerceAccessUxMessage } from "./commerce-access-control-errors";
import {
  assertMessagingAction,
  guardMessagingAction,
} from "./commerce-surface-access";
import { guardBackendRoute, guardCommerceResource } from "./commerce-access-control-guards";
import type { CommerceAccessContext } from "./commerce-access-control.types";
import {
  buildSafeMessagingAccessContext,
  evaluateMessagingGuardPriority,
  freezeMessagingAccessContext,
  getMessagingAccessRuntimeState,
  invalidateMessagingAccessRuntime,
  isParticipantSuspended,
  logMessagingAccessBlockedSuspended,
  MESSAGING_SUSPENDED_UX,
  normalizeParticipantStatus,
  resetCommerceAccessTestState,
} from "./messaging-access-priority";

function ctx(overrides: Partial<CommerceAccessContext> = {}): CommerceAccessContext {
  return {
    actorRole: "GROSSISTE_B",
    organizationId: "org-b",
    relationshipId: "rel-1",
    relationshipStatus: "ACTIVE",
    participantStatus: "ACTIVE",
    flags: {
      commerce_access_control_enabled: true,
      commerce_visibility_guard_enabled: true,
      commerce_backend_access_guard_enabled: true,
    },
    ...overrides,
  };
}

function suspendedCtx(overrides: Partial<CommerceAccessContext> = {}): CommerceAccessContext {
  return ctx({ participantStatus: "SUSPENDED", ...overrides });
}

describe("messaging suspended deterministic 20.86-E1", () => {
  beforeEach(() => {
    resetCommerceAccessTestState();
  });

  afterEach(() => {
    resetCommerceAccessTestState();
  });

  describe("suspended always blocked", () => {
    it("guardMessagingAction terrain", () => {
      expect(guardMessagingAction(suspendedCtx(), "terrain").allowed).toBe(false);
    });
    it("guardMessagingAction formal", () => {
      expect(guardMessagingAction(suspendedCtx({ actorRole: "PRODUCER" }), "formal").allowed).toBe(
        false,
      );
    });
    it("guardCommerceResource messaging", () => {
      expect(guardCommerceResource(suspendedCtx(), "messaging").allowed).toBe(false);
    });
    it("guardCommerceResource mail", () => {
      expect(guardCommerceResource(suspendedCtx(), "mail").allowed).toBe(false);
    });
    it("guardBackendRoute messaging", () => {
      expect(guardBackendRoute(suspendedCtx(), "messaging", "org-b").allowed).toBe(false);
    });
    it("assertMessagingAction throws", () => {
      expect(() => assertMessagingAction(suspendedCtx(), "terrain")).toThrow(MESSAGING_SUSPENDED_UX);
    });
  });

  describe("suspended before flags bypass", () => {
    it("messaging with access control disabled", () => {
      const off = ctx({
        participantStatus: "SUSPENDED",
        flags: { commerce_access_control_enabled: false },
      });
      expect(guardMessagingAction(off, "terrain").allowed).toBe(false);
    });
    it("commerce resource with control disabled", () => {
      const off = ctx({
        participantStatus: "SUSPENDED",
        flags: { commerce_access_control_enabled: false },
      });
      expect(guardCommerceResource(off, "messaging").allowed).toBe(false);
    });
    it("backend route with backend guard disabled", () => {
      const off = ctx({
        participantStatus: "SUSPENDED",
        flags: { commerce_backend_access_guard_enabled: false },
      });
      expect(guardBackendRoute(off, "messaging", "org-b").allowed).toBe(false);
    });
  });

  describe("guard priority order", () => {
    it("suspended before inactive relation check", () => {
      const d = evaluateMessagingGuardPriority(
        suspendedCtx({ relationshipStatus: "ACTIVE" }),
      );
      expect(d.allowed).toBe(false);
      if (!d.allowed) expect(d.reason).toBe("participant_suspended");
    });
    it("suspended before permissions would allow terrain", () => {
      expect(guardMessagingAction(suspendedCtx(), "terrain").errorCode).toBe(
        "messaging_participant_suspended",
      );
    });
    it("relation inactive after suspension cleared", () => {
      const d = evaluateMessagingGuardPriority(
        ctx({ relationshipStatus: "REMOVED", participantStatus: "ACTIVE" }),
      );
      expect(d.allowed).toBe(false);
      if (!d.allowed) expect(d.reason).toBe("relation_inactive");
    });
    it("runtime revocation blocks active participant", () => {
      invalidateMessagingAccessRuntime();
      const d = evaluateMessagingGuardPriority(ctx());
      expect(d.allowed).toBe(false);
      if (!d.allowed) expect(d.reason).toBe("access_revoked");
    });
  });

  describe("immutable context", () => {
    it("buildSafeMessagingAccessContext is frozen", () => {
      const safe = buildSafeMessagingAccessContext({
        organizationId: "org-b",
        actorRole: "GROSSISTE_B",
        relationshipId: "rel-1",
        participantStatus: "SUSPENDED",
      });
      expect(Object.isFrozen(safe)).toBe(true);
      expect(() => {
        (safe as { participantStatus: string }).participantStatus = "ACTIVE";
      }).toThrow();
    });
    it("freezeMessagingAccessContext normalizes status", () => {
      const frozen = freezeMessagingAccessContext(
        ctx({ participantStatus: "suspended" as CommerceAccessContext["participantStatus"] }),
      );
      expect(frozen.participantStatus).toBe("SUSPENDED");
    });
  });

  describe("cleanup and runtime", () => {
    it("resetCommerceAccessTestState clears log", () => {
      logMessagingAccessBlockedSuspended({ actor: "a" });
      resetCommerceAccessTestState();
      expect(getMessagingAccessRuntimeState().suspendLog).toHaveLength(0);
    });
    it("reset clears offline invalidation", () => {
      invalidateMessagingAccessRuntime();
      resetCommerceAccessTestState();
      expect(getMessagingAccessRuntimeState().offlineInvalidated).toBe(false);
    });
  });

  describe("offline and routing", () => {
    it("offline invalidation blocks messaging guard", () => {
      invalidateMessagingAccessRuntime();
      expect(guardMessagingAction(ctx(), "terrain").allowed).toBe(false);
    });
    it("offline invalidation blocks commerce resource", () => {
      invalidateMessagingAccessRuntime();
      expect(guardCommerceResource(ctx(), "messaging").allowed).toBe(false);
    });
  });

  describe("humanized UX", () => {
    it("no forbidden jargon in suspended message", () => {
      expect(MESSAGING_SUSPENDED_UX).not.toMatch(/forbidden|unauthorized|access denied/i);
    });
    it("commerce error code uses humanized copy", () => {
      expect(commerceAccessUxMessage("messaging_participant_suspended")).toBe(MESSAGING_SUSPENDED_UX);
    });
    it("decision userMessage matches UX", () => {
      expect(guardMessagingAction(suspendedCtx(), "terrain").userMessage).toBe(MESSAGING_SUSPENDED_UX);
    });
  });

  describe("normalizeParticipantStatus", () => {
    it("lowercase suspended", () => {
      expect(normalizeParticipantStatus("suspended")).toBe("SUSPENDED");
    });
    it("isParticipantSuspended", () => {
      expect(isParticipantSuspended("SUSPENDED")).toBe(true);
      expect(isParticipantSuspended("ACTIVE")).toBe(false);
    });
  });

  describe("logging", () => {
    it("records MESSAGING_ACCESS_BLOCKED_SUSPENDED", () => {
      evaluateMessagingGuardPriority(suspendedCtx(), { route: "messaging", actor: "org-b" });
      const log = getMessagingAccessRuntimeState().suspendLog;
      expect(log.length).toBeGreaterThan(0);
      expect(log[log.length - 1]?.code).toBe("MESSAGING_ACCESS_BLOCKED_SUSPENDED");
    });
  });

  describe("stress and ordering", () => {
    it("500 sequential suspended blocks", () => {
      for (let i = 0; i < 500; i += 1) {
        expect(guardMessagingAction(suspendedCtx(), "terrain").allowed).toBe(false);
      }
    });

    it("parallel 100 suspended blocks", async () => {
      const results = await Promise.all(
        Array.from({ length: 100 }, () =>
          Promise.resolve(guardMessagingAction(suspendedCtx(), "terrain").allowed),
        ),
      );
      expect(results.every((r) => r === false)).toBe(true);
    });

    it("shuffled runs after active then revoked", () => {
      const runs: Array<{ setup: () => void; expectAllowed: boolean; run: () => boolean }> = [
        {
          setup: () => resetCommerceAccessTestState(),
          expectAllowed: true,
          run: () => guardMessagingAction(ctx(), "terrain").allowed,
        },
        {
          setup: () => resetCommerceAccessTestState(),
          expectAllowed: false,
          run: () => guardMessagingAction(suspendedCtx(), "terrain").allowed,
        },
        {
          setup: () => {
            resetCommerceAccessTestState();
            invalidateMessagingAccessRuntime();
          },
          expectAllowed: false,
          run: () => guardMessagingAction(ctx(), "terrain").allowed,
        },
        {
          setup: () => resetCommerceAccessTestState(),
          expectAllowed: false,
          run: () => guardMessagingAction(suspendedCtx(), "terrain").allowed,
        },
      ];
      const order = [0, 1, 2, 3, 1, 0, 3, 2];
      for (const idx of order) {
        const step = runs[idx]!;
        step.setup();
        expect(step.run()).toBe(step.expectAllowed);
      }
    });

    it("run after simulated active user tests", () => {
      expect(guardMessagingAction(ctx(), "terrain").allowed).toBe(true);
      expect(guardMessagingAction(ctx(), "terrain").allowed).toBe(true);
      expect(guardMessagingAction(suspendedCtx(), "terrain").allowed).toBe(false);
    });

    it("multiple cache-like rebuilds", () => {
      for (let i = 0; i < 50; i += 1) {
        const safe = buildSafeMessagingAccessContext({
          organizationId: "org-b",
          actorRole: "GROSSISTE_B",
          relationshipId: "rel-1",
          participantStatus: "SUSPENDED",
        });
        expect(evaluateMessagingGuardPriority(safe).allowed).toBe(false);
      }
    });
  });

  describe("BFF and backend paths", () => {
    it("guardBackendRoute mail suspended", () => {
      expect(guardBackendRoute(suspendedCtx(), "mail", "org-b").allowed).toBe(false);
    });
    it("backend messaging with flags off still blocks suspended", () => {
      expect(
        guardBackendRoute(
          suspendedCtx({ flags: { commerce_backend_access_guard_enabled: false } }),
          "messaging",
          "org-b",
        ).allowed,
      ).toBe(false);
    });
    it("participant suspended on non-messaging still blocked at resource guard", () => {
      expect(guardCommerceResource(suspendedCtx(), "order").allowed).toBe(false);
    });
    it("suspended lowercase via normalize in guard", () => {
      expect(
        guardMessagingAction(
          ctx({ participantStatus: "suspended" as CommerceAccessContext["participantStatus"] }),
          "terrain",
        ).allowed,
      ).toBe(false);
    });
    it("active participant after reset allows terrain", () => {
      invalidateMessagingAccessRuntime();
      resetCommerceAccessTestState();
      expect(guardMessagingAction(ctx(), "terrain").allowed).toBe(true);
    });
  });
});
