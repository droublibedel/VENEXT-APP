import { Injectable, Logger, Optional } from "@nestjs/common";
import { OrganizationCategory, TemporaryCommercialHandshakeState } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { SponsoredConversationRealtimePublishService } from "./sponsored-conversation-realtime-publish.service";
import { SponsoredExposureAnalyticsService } from "./sponsored-exposure-analytics.service";
import { buildSponsoredMaintenanceWsBody } from "./sponsored-realtime-payload.helper";
import { CommercialTrustTouchService } from "../commercial-trust/commercial-trust-touch.service";

export type SponsoredExpirationRunResult = {
  runAt: string;
  expiredCount: number;
  skippedCount: number;
  windowIds: string[];
  emittedEventsCount: number;
};

/**
 * Instruction 20.2A/20.2B — expiration active + idempotence (updateMany + pas de WS/analytics si déjà expiré).
 */
@Injectable()
export class SponsoredConversationExpirationService {
  private readonly log = new Logger(SponsoredConversationExpirationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: SponsoredConversationRealtimePublishService,
    private readonly analytics: SponsoredExposureAnalyticsService,
    @Optional() private readonly trustTouch?: CommercialTrustTouchService,
  ) {}

  async expireDueWindows(now: Date = new Date()): Promise<SponsoredExpirationRunResult> {
    const runAt = now.toISOString();
    this.log.log(JSON.stringify({ job: "sponsored_expire_due_windows", phase: "started", runAt }));

    const candidates = await this.prisma.sponsoredConversationWindow.findMany({
      where: {
        expiresAt: { lte: now },
        state: { not: TemporaryCommercialHandshakeState.SPONSORED_WINDOW_EXPIRED },
      },
      include: {
        messageThreads: { select: { id: true } },
        target: { select: { category: true } },
      },
    });

    if (candidates.length === 0) {
      this.log.log(JSON.stringify({ job: "sponsored_expire_due_windows", phase: "nothing_to_expire", runAt }));
      return { runAt, expiredCount: 0, skippedCount: 0, windowIds: [], emittedEventsCount: 0 };
    }

    const windowIds: string[] = [];
    let expiredCount = 0;
    let skippedCount = 0;
    let emittedEventsCount = 0;
    const trustOrgs = new Set<string>();

    for (const w of candidates) {
      const prevState = w.state;
      const upd = await this.prisma.sponsoredConversationWindow.updateMany({
        where: {
          id: w.id,
          expiresAt: { lte: now },
          state: { not: TemporaryCommercialHandshakeState.SPONSORED_WINDOW_EXPIRED },
        },
        data: {
          state: TemporaryCommercialHandshakeState.SPONSORED_WINDOW_EXPIRED,
          temporaryConversationAllowed: false,
          lastActivityAt: now,
        },
      });

      if (upd.count === 0) {
        skippedCount += 1;
        continue;
      }

      expiredCount += 1;
      windowIds.push(w.id);
      trustOrgs.add(w.sponsorOrganizationId);
      trustOrgs.add(w.targetOrganizationId);

      const actorType = w.target.category ?? OrganizationCategory.RETAILER;
      await this.analytics.bumpWindowExpired(undefined, {
        sponsorOrganizationId: w.sponsorOrganizationId,
        campaignId: w.campaignId,
        region: w.regionScope,
        city: w.cityScope,
        district: w.districtScope,
        targetActorType: String(actorType),
        at: now,
      });

      for (const t of w.messageThreads) {
        await this.realtime.publish(t.id, w.sponsorOrganizationId, "sponsored.window.expired", {
          ...buildSponsoredMaintenanceWsBody({
            windowId: w.id,
            campaignId: w.campaignId,
            sponsorOrganizationId: w.sponsorOrganizationId,
            targetOrganizationId: w.targetOrganizationId,
            relationshipId: w.relationshipId,
            sponsoredScopeValidated: true,
            temporaryCommercialHandshake: true,
            relationshipStillRequired: true,
            previousWindowState: prevState,
          }),
        });
        emittedEventsCount += 1;
      }
    }

    this.log.log(
      JSON.stringify({
        job: "sponsored_expire_due_windows",
        phase: "completed",
        runAt,
        expiredCount,
        skippedCount,
        emittedEventsCount,
        candidateCount: candidates.length,
      }),
    );

    if (trustOrgs.size > 0) {
      this.trustTouch?.touchOrganizations([...trustOrgs]);
    }

    return { runAt, expiredCount, skippedCount, windowIds, emittedEventsCount };
  }
}
