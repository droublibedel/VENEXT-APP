import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { RelationshipSource, RelationshipStatus, SponsoredRelationshipRequestState, TemporaryCommercialHandshakeState } from "@prisma/client";

import { InternalSponsoredDiscoveryMaintenanceController } from "./internal-sponsored-discovery-maintenance.controller";
import { SponsoredConversationExpirationService } from "./sponsored-conversation-expiration.service";
import { SponsoredRelationshipModerationHookService } from "./sponsored-relationship-moderation-hook.service";
import { SponsoredRelationshipSyncService } from "./sponsored-relationship-sync.service";

describe("Instruction 20.2B — internal maintenance security", () => {
  it("rejects missing or wrong internal key", async () => {
    const prev = process.env.VENEXT_INTERNAL_REALTIME_KEY;
    process.env.VENEXT_INTERNAL_REALTIME_KEY = "secret-maintenance";
    const ctrl = new InternalSponsoredDiscoveryMaintenanceController({} as never, {} as never);
    await expect(ctrl.expireDueWindows(undefined)).rejects.toThrow(UnauthorizedException);
    await expect(ctrl.expireDueWindows("wrong")).rejects.toThrow(UnauthorizedException);
    process.env.VENEXT_INTERNAL_REALTIME_KEY = prev;
  });
});

describe("Instruction 20.2B — expiration idempotence", () => {
  it("second pass emits no WS when updateMany applies zero rows", async () => {
    const w = {
      id: "w1",
      state: TemporaryCommercialHandshakeState.SPONSORED_NEGOTIATION_ACTIVE,
      expiresAt: new Date("2020-01-01"),
      campaignId: "c1",
      sponsorOrganizationId: "s1",
      targetOrganizationId: "t1",
      relationshipId: null,
      regionScope: "SN",
      cityScope: null,
      districtScope: null,
      messageThreads: [{ id: "th1" }],
      target: { category: "RETAILER" },
    };
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([w])
      .mockResolvedValueOnce([]); // second global call: nothing to expire
    let updateManyCalls = 0;
    const updateMany = vi.fn().mockImplementation(() => {
      updateManyCalls += 1;
      return Promise.resolve({ count: updateManyCalls === 1 ? 1 : 0 });
    });
    const prisma = { sponsoredConversationWindow: { findMany, updateMany } };
    const realtime = { publish: vi.fn() };
    const analytics = { bumpWindowExpired: vi.fn() };
    const svc = new SponsoredConversationExpirationService(prisma as never, realtime as never, analytics as never);
    const first = await svc.expireDueWindows(new Date("2026-06-01T00:00:00Z"));
    expect(first.expiredCount).toBe(1);
    expect(first.emittedEventsCount).toBe(1);
    expect(realtime.publish).toHaveBeenCalledTimes(1);
    const second = await svc.expireDueWindows(new Date("2026-06-01T00:00:00Z"));
    expect(second.expiredCount).toBe(0);
    expect(second.emittedEventsCount).toBe(0);
    expect(realtime.publish).toHaveBeenCalledTimes(1);
  });
});

describe("Instruction 20.2B — moderation hook (no auto-accept)", () => {
  it("refuses sync when Relationship is still PENDING", async () => {
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({ id: "r1", status: RelationshipStatus.PENDING }),
      },
    };
    const sync = { syncFromRelationshipId: vi.fn() };
    const hook = new SponsoredRelationshipModerationHookService(prisma as never, sync as never);
    await expect(hook.handleRelationshipModerationDecision("r1")).rejects.toBeInstanceOf(BadRequestException);
    expect(sync.syncFromRelationshipId).not.toHaveBeenCalled();
  });
});

describe("Instruction 20.2B — relationship sync idempotence", () => {
  it("skips WS and analytics when window already RELATIONSHIP_ACCEPTED", async () => {
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          id: "r1",
          status: RelationshipStatus.ACCEPTED,
          source: RelationshipSource.SPONSORED_DISCOVERY,
          requesterOrganizationId: "a",
          receiverOrganizationId: "b",
        }),
      },
      sponsoredConversationWindow: {
        findFirst: vi.fn().mockResolvedValue({
          id: "w1",
          state: TemporaryCommercialHandshakeState.RELATIONSHIP_ACCEPTED,
          campaignId: "c1",
          sponsorOrganizationId: "s1",
          targetOrganizationId: "t1",
          relationshipId: "r1",
          convertedToRelationship: true,
          temporaryConversationAllowed: false,
          regionScope: null,
          cityScope: null,
          districtScope: null,
          messageThreads: [{ id: "th1" }],
          target: { category: "RETAILER" },
        }),
        updateMany: vi.fn(),
      },
      sponsoredRelationshipRequest: {
        findFirst: vi.fn().mockResolvedValue({ requestState: SponsoredRelationshipRequestState.RELATIONSHIP_ACCEPTED_SYNCED }),
      },
    };
    const realtime = { publish: vi.fn() };
    const analytics = { bumpRelationshipAcceptedSynced: vi.fn(), bumpRelationshipRejectedSynced: vi.fn() };
    const svc = new SponsoredRelationshipSyncService(prisma as never, realtime as never, analytics as never);
    const out = await svc.syncFromRelationshipId("r1");
    expect(out.skipped).toBe(true);
    expect(out.emittedEventsCount).toBe(0);
    expect(prisma.sponsoredConversationWindow.updateMany).not.toHaveBeenCalled();
    expect(analytics.bumpRelationshipAcceptedSynced).not.toHaveBeenCalled();
  });
});
