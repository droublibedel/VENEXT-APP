import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Optional } from "@nestjs/common";
import {
  NegotiationStatus,
  Prisma,
  RelationshipSource,
  RelationshipStatus,
  TemporaryCommercialHandshakeState,
  ThreadType,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { SponsoredConversationEligibilityService } from "./sponsored-conversation-eligibility.service";
import { SponsoredConversationRealtimePublishService } from "./sponsored-conversation-realtime-publish.service";
import { SponsoredExposureAnalyticsService } from "./sponsored-exposure-analytics.service";
import type { SponsoredThreadDiagnostics } from "./sponsored-conversation.types";
import { DEFAULT_SPONSORED_VISIBILITY } from "./sponsored-conversation.types";
import { CommercialTrustTouchService } from "../commercial-trust/commercial-trust-touch.service";

function buildThreadDiagnostics(input: {
  windowId: string;
  campaignId: string;
  sponsorOrganizationId: string;
  productId: string;
  expiresAt: Date;
  state: TemporaryCommercialHandshakeState;
  discoverySource: string;
}): SponsoredThreadDiagnostics {
  return {
    sponsoredConversation: true,
    relationshipAccepted: false,
    temporaryCommercialScope: true,
    sponsoredWindowExpiresAt: input.expiresAt.toISOString(),
    commercialAccessLevel: "SPONSORED_DISCOVERY_ONLY",
    catalogVisibilityRestricted: true,
    relationshipRequiredForOrders: true,
    sponsorOrganizationId: input.sponsorOrganizationId,
    sponsoredProductId: input.productId,
    campaignId: input.campaignId,
    handshakeState: input.state,
    discoverySource: input.discoverySource,
  };
}

@Injectable()
export class SponsoredCommercialFlowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibility: SponsoredConversationEligibilityService,
    private readonly realtime: SponsoredConversationRealtimePublishService,
    private readonly exposure: SponsoredExposureAnalyticsService,
    @Optional() private readonly trustTouch?: CommercialTrustTouchService,
  ) {}

  private activeWindowWhere(
    camp: { id: string; sponsorOrganizationId: string; productId: string },
    targetOrganizationId: string,
    now: Date,
  ): Prisma.SponsoredConversationWindowWhereInput {
    return {
      campaignId: camp.id,
      sponsorOrganizationId: camp.sponsorOrganizationId,
      targetOrganizationId,
      productId: camp.productId,
      expiresAt: { gt: now },
      state: {
        notIn: [
          TemporaryCommercialHandshakeState.SPONSORED_WINDOW_EXPIRED,
          TemporaryCommercialHandshakeState.RELATIONSHIP_REJECTED,
        ],
      },
    };
  }

  /** Read-only surface: no analytics bump (Instruction 20.2A catalog safety / minimal slice). */
  async getCampaignProductSurface(actor: CommerceThreadResolvedActor, campaignId: string) {
    const out = await this.eligibility.evaluate({ campaignId, actorOrganizationId: actor.organizationId });
    const camp = await this.prisma.sponsoredCommercialCampaign.findUnique({
      where: { id: campaignId },
      include: {
        product: { select: { id: true, name: true, category: true, currency: true, unitLabel: true, active: true } },
        sponsor: { select: { id: true, displayName: true, commercialId: true, country: true, city: true } },
      },
    });
    return {
      eligible: out.eligible,
      reasons: out.reasons,
      catalogAccessLevel: "SPONSORED_PRODUCT_SLICE_ONLY" as const,
      relationshipRequiredForOrders: true,
      visibility: {
        ...DEFAULT_SPONSORED_VISIBILITY,
        visibleProductIds: camp?.productId ? [camp.productId] : [],
      },
      campaign: camp
        ? {
            id: camp.id,
            sponsorOrganizationId: camp.sponsorOrganizationId,
            product: camp.product,
            sponsorPublic: {
              displayName: camp.sponsor.displayName,
              commercialId: camp.sponsor.commercialId,
              country: camp.sponsor.country,
              city: camp.sponsor.city,
            },
            discoverySource: camp.discoverySource,
            regionScope: camp.regionScope,
            cityScope: camp.cityScope,
            districtScope: camp.districtScope,
          }
        : null,
    };
  }

  async evaluateDiscovery(actor: CommerceThreadResolvedActor, campaignId: string) {
    const out = await this.eligibility.evaluate({ campaignId, actorOrganizationId: actor.organizationId });
    const camp = await this.prisma.sponsoredCommercialCampaign.findUnique({
      where: { id: campaignId },
      include: { product: { select: { id: true, name: true, category: true } }, sponsor: { select: { id: true, displayName: true, commercialId: true, country: true, city: true } } },
    });
    if (camp && out.eligible) {
      const org = await this.prisma.organization.findUnique({
        where: { id: actor.organizationId },
        select: { category: true },
      });
      await this.exposure.bumpImpression(undefined, {
        sponsorOrganizationId: camp.sponsorOrganizationId,
        campaignId: camp.id,
        region: camp.regionScope,
        city: camp.cityScope,
        district: camp.districtScope,
        targetActorType: String(org?.category ?? "UNKNOWN"),
      });
    }
    return {
      eligible: out.eligible,
      reasons: out.reasons,
      visibility: {
        ...DEFAULT_SPONSORED_VISIBILITY,
        visibleProductIds: camp?.productId ? [camp.productId] : [],
      },
      campaign: camp
        ? {
            id: camp.id,
            sponsorOrganizationId: camp.sponsorOrganizationId,
            product: camp.product,
            sponsorPublic: {
              displayName: camp.sponsor.displayName,
              commercialId: camp.sponsor.commercialId,
              country: camp.sponsor.country,
              city: camp.sponsor.city,
            },
            discoverySource: camp.discoverySource,
            regionScope: camp.regionScope,
            cityScope: camp.cityScope,
          }
        : null,
    };
  }

  async openSponsoredConversation(actor: CommerceThreadResolvedActor, campaignId: string) {
    const camp = await this.prisma.sponsoredCommercialCampaign.findUnique({ where: { id: campaignId } });
    if (!camp) throw new NotFoundException(campaignId);

    const now = new Date();
    const existing = await this.prisma.sponsoredConversationWindow.findFirst({
      where: {
        AND: [this.activeWindowWhere(camp, actor.organizationId, now), { messageThreads: { some: {} } }],
      },
      include: {
        messageThreads: { take: 1, orderBy: { createdAt: "asc" } },
      },
    });
    if (existing?.messageThreads[0]?.id) {
      const thread = existing.messageThreads[0];
      const negotiation = await this.prisma.negotiation.findUnique({ where: { id: thread.negotiationId! } });
      if (!negotiation) throw new BadRequestException({ code: "sponsored_reuse_missing_negotiation" });
      const diag = buildThreadDiagnostics({
        windowId: existing.id,
        campaignId: camp.id,
        sponsorOrganizationId: camp.sponsorOrganizationId,
        productId: camp.productId,
        expiresAt: existing.expiresAt,
        state: existing.state,
        discoverySource: camp.discoverySource,
      });
      return {
        window: existing,
        negotiation,
        thread: thread,
        diagnostics: diag,
        existingWindowReused: true,
        activeWindowUniquenessEnforced: true,
      };
    }

    const gate = await this.eligibility.evaluate({ campaignId, actorOrganizationId: actor.organizationId });
    if (!gate.eligible) {
      throw new ForbiddenException({ code: "sponsored_discovery_not_eligible", reasons: gate.reasons });
    }

    const expiresAt = new Date(now.getTime() + camp.windowDurationHours * 3600_000);
    const org = await this.prisma.organization.findUnique({
      where: { id: actor.organizationId },
      select: { category: true },
    });
    const targetActorType = String(org?.category ?? "UNKNOWN");

    const result = await this.prisma.$transaction(async (tx) => {
      const again = await tx.sponsoredConversationWindow.findFirst({
        where: {
          AND: [this.activeWindowWhere(camp, actor.organizationId, now), { messageThreads: { some: {} } }],
        },
        include: { messageThreads: { take: 1, orderBy: { createdAt: "asc" } } },
      });
      if (again?.messageThreads[0]?.id) {
        const thread = again.messageThreads[0];
        const negotiation = await tx.negotiation.findUnique({ where: { id: thread.negotiationId! } });
        if (!negotiation) throw new BadRequestException({ code: "sponsored_race_missing_negotiation" });
        const diag = buildThreadDiagnostics({
          windowId: again.id,
          campaignId: camp.id,
          sponsorOrganizationId: camp.sponsorOrganizationId,
          productId: camp.productId,
          expiresAt: again.expiresAt,
          state: again.state,
          discoverySource: camp.discoverySource,
        });
        return {
          window: again,
          negotiation,
          thread,
          diagnostics: diag,
          existingWindowReused: true,
          activeWindowUniquenessEnforced: true,
        };
      }

      const window = await tx.sponsoredConversationWindow.create({
        data: {
          campaignId: camp.id,
          sponsorOrganizationId: camp.sponsorOrganizationId,
          targetOrganizationId: actor.organizationId,
          productId: camp.productId,
          state: TemporaryCommercialHandshakeState.SPONSORED_NEGOTIATION_ACTIVE,
          regionScope: camp.regionScope,
          cityScope: camp.cityScope,
          districtScope: camp.districtScope,
          expiresAt,
          openedAt: now,
          lastActivityAt: now,
          sponsorBudgetSnapshot: (camp.sponsorBudgetSnapshot ?? {}) as Prisma.InputJsonValue,
          discoverySource: camp.discoverySource,
        },
      });

      const negotiation = await tx.negotiation.create({
        data: {
          productId: camp.productId,
          buyerOrganizationId: actor.organizationId,
          sellerOrganizationId: camp.sponsorOrganizationId,
          status: NegotiationStatus.OPEN,
          expiresAt,
        },
      });

      const diag = buildThreadDiagnostics({
        windowId: window.id,
        campaignId: camp.id,
        sponsorOrganizationId: camp.sponsorOrganizationId,
        productId: camp.productId,
        expiresAt,
        state: TemporaryCommercialHandshakeState.SPONSORED_NEGOTIATION_ACTIVE,
        discoverySource: camp.discoverySource,
      });

      const thread = await tx.messageThread.create({
        data: {
          threadType: ThreadType.SPONSORED_DISCOVERY_THREAD,
          productId: camp.productId,
          negotiationId: negotiation.id,
          buyerOrganizationId: actor.organizationId,
          sellerOrganizationId: camp.sponsorOrganizationId,
          sponsoredConversationWindowId: window.id,
          sponsoredDiscoveryMetadata: diag as unknown as Prisma.InputJsonValue,
        },
      });

      await this.exposure.bumpOpenBundle(tx, {
        sponsorOrganizationId: camp.sponsorOrganizationId,
        campaignId: camp.id,
        region: camp.regionScope,
        city: camp.cityScope,
        district: camp.districtScope,
        targetActorType,
        at: now,
      });

      return {
        window,
        negotiation,
        thread,
        diagnostics: diag,
        existingWindowReused: false,
        activeWindowUniquenessEnforced: true,
      };
    });

    if (!result.existingWindowReused) {
      await this.realtime.publish(result.thread.id, camp.sponsorOrganizationId, "sponsored.discovery.opened", {
        campaignId: camp.id,
        windowId: result.window.id,
      });
      await this.realtime.publish(result.thread.id, camp.sponsorOrganizationId, "sponsored.thread.created", {
        windowId: result.window.id,
        negotiationId: result.negotiation.id,
      });
      await this.realtime.publish(result.thread.id, camp.sponsorOrganizationId, "sponsored.negotiation.started", {
        negotiationId: result.negotiation.id,
      });
    }

    this.trustTouch?.touchOrganizations([camp.sponsorOrganizationId, actor.organizationId]);

    return result;
  }

  async requestOfficialRelationship(
    actor: CommerceThreadResolvedActor,
    input: { windowId: string; motivation?: string },
  ) {
    const window = await this.prisma.sponsoredConversationWindow.findUnique({
      where: { id: input.windowId },
      include: { campaign: true, target: { select: { category: true } } },
    });
    if (!window) throw new NotFoundException(input.windowId);
    if (window.expiresAt < new Date()) {
      throw new BadRequestException({ code: "sponsored_window_expired" });
    }
    if (actor.organizationId !== window.targetOrganizationId) {
      throw new ForbiddenException({ code: "only_target_may_request_relationship" });
    }

    const rel = await this.prisma.relationship.create({
      data: {
        requesterOrganizationId: window.targetOrganizationId,
        receiverOrganizationId: window.sponsorOrganizationId,
        status: RelationshipStatus.PENDING,
        source: RelationshipSource.SPONSORED_DISCOVERY,
        upstreamOrganizationId: window.sponsorOrganizationId,
        downstreamOrganizationId: window.targetOrganizationId,
        commerceCategory: "SPONSORED_DISCOVERY",
        trustLevel: 0.45,
      },
    });

    const req = await this.prisma.sponsoredRelationshipRequest.create({
      data: {
        requesterOrganizationId: window.targetOrganizationId,
        targetOrganizationId: window.sponsorOrganizationId,
        sponsoredConversationWindowId: window.id,
        motivation: input.motivation ?? null,
      },
    });

    await this.prisma.sponsoredConversationWindow.update({
      where: { id: window.id },
      data: {
        state: TemporaryCommercialHandshakeState.RELATIONSHIP_REQUESTED,
        relationshipId: rel.id,
        lastActivityAt: new Date(),
      },
    });

    const targetActorType = String(window.target.category ?? "UNKNOWN");
    await this.exposure.bumpRelationshipRequest(undefined, {
      sponsorOrganizationId: window.sponsorOrganizationId,
      campaignId: window.campaignId,
      region: window.regionScope,
      city: window.cityScope,
      district: window.districtScope,
      targetActorType,
    });

    const msgThread = await this.prisma.messageThread.findFirst({
      where: { sponsoredConversationWindowId: window.id },
      select: { id: true },
    });
    if (!msgThread) {
      throw new BadRequestException({ code: "sponsored_thread_missing_for_realtime" });
    }

    await this.realtime.publish(msgThread.id, window.sponsorOrganizationId, "sponsored.relationship.requested", {
      windowId: window.id,
      relationshipId: rel.id,
      requestId: req.id,
    });

    this.trustTouch?.touchOrganizations([window.sponsorOrganizationId, window.targetOrganizationId]);

    return { relationshipId: rel.id, requestId: req.id, status: RelationshipStatus.PENDING };
  }
}
