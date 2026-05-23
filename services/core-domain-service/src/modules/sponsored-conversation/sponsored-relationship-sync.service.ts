import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, Optional } from "@nestjs/common";
import {
  RelationshipSource,
  RelationshipStatus,
  SponsoredRelationshipRequestState,
  TemporaryCommercialHandshakeState,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { SponsoredConversationRealtimePublishService } from "./sponsored-conversation-realtime-publish.service";
import { SponsoredExposureAnalyticsService } from "./sponsored-exposure-analytics.service";
import { buildSponsoredMaintenanceWsBody } from "./sponsored-realtime-payload.helper";
import { CommercialTrustTouchService } from "../commercial-trust/commercial-trust-touch.service";
import { RelationshipGovernanceService } from "../relationship-governance/relationship-governance.service";
import { detectOptionalDependencyStatus } from "../relationship-governance/relationship-governance-optional-deps";

export type SponsoredRelationshipSyncResult = {
  relationshipId: string;
  synced: boolean;
  skipped: boolean;
  skipReason?: string;
  windowId?: string;
  previousWindowState?: TemporaryCommercialHandshakeState;
  nextWindowState?: TemporaryCommercialHandshakeState;
  requestState?: SponsoredRelationshipRequestState | null;
  convertedToRelationship?: boolean;
  temporaryConversationAllowed?: boolean;
  sponsorOrganizationId?: string;
  targetOrganizationId?: string;
  campaignId?: string;
  emittedEventsCount: number;
  /** Instruction 20.4B — corridor outcome awaited after sponsor window sync */
  corridorGovernanceSynced?: boolean;
  corridorGovernanceError?: string;
  corridorStateAfterSync?: string;
  corridorSignalApplied?: string[];
  optionalDependencyDiagnostics?: ReturnType<typeof detectOptionalDependencyStatus>;
};

/**
 * Instruction 20.2A/20.2B — aligne fenêtre + demande sponsorisée après **décision humaine** sur `Relationship`.
 */
@Injectable()
export class SponsoredRelationshipSyncService {
  private readonly log = new Logger(SponsoredRelationshipSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: SponsoredConversationRealtimePublishService,
    private readonly analytics: SponsoredExposureAnalyticsService,
    @Optional() private readonly trustTouch?: CommercialTrustTouchService,
    @Optional() private readonly corridorGovernance?: RelationshipGovernanceService,
  ) {}

  async syncFromRelationshipId(relationshipId: string): Promise<SponsoredRelationshipSyncResult> {
    const rid = relationshipId.trim();
    const rel = await this.prisma.relationship.findUnique({
      where: { id: rid },
      select: {
        id: true,
        status: true,
        source: true,
        requesterOrganizationId: true,
        receiverOrganizationId: true,
      },
    });
    if (!rel) {
      this.log.warn(JSON.stringify({ job: "sponsored_sync_relationship", phase: "invalid_relationship_id", relationshipId: rid }));
      throw new NotFoundException(rid);
    }

    const window = await this.prisma.sponsoredConversationWindow.findFirst({
      where: { relationshipId: rid },
      include: {
        messageThreads: { select: { id: true }, take: 1 },
        target: { select: { category: true } },
      },
    });

    if (!window) {
      if (rel.source !== RelationshipSource.SPONSORED_DISCOVERY) {
        this.log.log(
          JSON.stringify({
            job: "sponsored_sync_relationship",
            phase: "sync_skipped",
            relationshipId: rid,
            reason: "no_sponsored_window_and_not_sponsored_source",
          }),
        );
      }
      return {
        relationshipId: rid,
        synced: false,
        skipped: true,
        skipReason: "no_sponsored_conversation_window",
        emittedEventsCount: 0,
      };
    }

    const actorType = window.target.category ?? "UNKNOWN";
    const threadId = window.messageThreads[0]?.id;
    const baseCtx = {
      windowId: window.id,
      campaignId: window.campaignId,
      sponsorOrganizationId: window.sponsorOrganizationId,
      targetOrganizationId: window.targetOrganizationId,
      relationshipId: rel.id,
    };

    if (rel.status === RelationshipStatus.ACCEPTED) {
      if (window.state === TemporaryCommercialHandshakeState.RELATIONSHIP_ACCEPTED) {
        const reqRow = await this.prisma.sponsoredRelationshipRequest.findFirst({
          where: { sponsoredConversationWindowId: window.id },
          select: { requestState: true },
        });
        this.log.log(
          JSON.stringify({
            job: "sponsored_sync_relationship",
            phase: "nothing_to_sync",
            relationshipId: rid,
            windowId: window.id,
            reason: "window_already_relationship_accepted",
          }),
        );
        return {
          relationshipId: rid,
          synced: false,
          skipped: true,
          skipReason: "already_synced",
          windowId: window.id,
          previousWindowState: window.state,
          nextWindowState: window.state,
          requestState: reqRow?.requestState ?? null,
          convertedToRelationship: window.convertedToRelationship,
          temporaryConversationAllowed: window.temporaryConversationAllowed,
          sponsorOrganizationId: window.sponsorOrganizationId,
          targetOrganizationId: window.targetOrganizationId,
          campaignId: window.campaignId,
          emittedEventsCount: 0,
        };
      }

      const prev = window.state;
      const count = await this.prisma.sponsoredConversationWindow.updateMany({
        where: {
          id: window.id,
          state: { not: TemporaryCommercialHandshakeState.RELATIONSHIP_ACCEPTED },
        },
        data: {
          state: TemporaryCommercialHandshakeState.RELATIONSHIP_ACCEPTED,
          convertedToRelationship: true,
          temporaryConversationAllowed: false,
          lastActivityAt: new Date(),
        },
      });
      if (count.count === 0) {
        return {
          relationshipId: rid,
          synced: false,
          skipped: true,
          skipReason: "concurrent_update",
          windowId: window.id,
          emittedEventsCount: 0,
        };
      }

      await this.prisma.sponsoredRelationshipRequest.updateMany({
        where: { sponsoredConversationWindowId: window.id },
        data: { requestState: SponsoredRelationshipRequestState.RELATIONSHIP_ACCEPTED_SYNCED },
      });

      const reqRow = await this.prisma.sponsoredRelationshipRequest.findFirst({
        where: { sponsoredConversationWindowId: window.id },
        select: { requestState: true },
      });

      const optionalDependencyDiagnostics = detectOptionalDependencyStatus({
        sponsoredSyncCorridorGovernanceMissing: !this.corridorGovernance,
        trustProfileRowMissing: false,
        negotiationCorridorPolicyMissing: false,
        cartConversionCorridorPolicyMissing: false,
        corridorRealtimePublisherUnconfigured: false,
        commercialTrustTouchMissing: !this.trustTouch,
      });

      if (process.env.NODE_ENV === "production" && !this.corridorGovernance) {
        this.log.error(
          JSON.stringify({
            job: "sponsored_sync_relationship",
            phase: "corridor_governance_missing_prod_fail_closed",
            relationshipId: rid,
            optionalDependencyMissing: optionalDependencyDiagnostics.optionalDependencyMissing,
          }),
        );
        throw new InternalServerErrorException({
          code: "corridor_governance_required_for_sponsored_sync",
          optionalDependencyMissing: optionalDependencyDiagnostics.optionalDependencyMissing,
        });
      }

      if (!this.corridorGovernance) {
        this.log.warn(
          JSON.stringify({
            job: "sponsored_sync_relationship",
            phase: "corridor_governance_missing_dev",
            relationshipId: rid,
            optionalDependencyWarnings: optionalDependencyDiagnostics.optionalDependencyWarnings,
          }),
        );
        const fresh = await this.prisma.sponsoredConversationWindow.findUnique({
          where: { id: window.id },
          select: { state: true, convertedToRelationship: true, temporaryConversationAllowed: true },
        });
        return {
          relationshipId: rid,
          synced: true,
          skipped: false,
          windowId: window.id,
          previousWindowState: prev,
          nextWindowState: fresh?.state,
          requestState: reqRow?.requestState ?? null,
          convertedToRelationship: fresh?.convertedToRelationship,
          temporaryConversationAllowed: fresh?.temporaryConversationAllowed,
          sponsorOrganizationId: window.sponsorOrganizationId,
          targetOrganizationId: window.targetOrganizationId,
          campaignId: window.campaignId,
          emittedEventsCount: 0,
          corridorGovernanceSynced: false,
          corridorGovernanceError: "RelationshipGovernanceService_optional_missing",
          optionalDependencyDiagnostics,
        };
      }

      let corridorOutcome: Awaited<ReturnType<RelationshipGovernanceService["applySponsoredRelationshipOutcome"]>>;
      try {
        corridorOutcome = await this.corridorGovernance.applySponsoredRelationshipOutcome(rid, "accepted");
      } catch (e) {
        const detail = e instanceof BadRequestException ? e.getResponse() : String((e as Error).message);
        this.log.warn(
          JSON.stringify({
            job: "sponsored_sync_relationship",
            phase: "corridor_outcome_failed",
            relationshipId: rid,
            detail,
          }),
        );
        const fresh = await this.prisma.sponsoredConversationWindow.findUnique({
          where: { id: window.id },
          select: { state: true, convertedToRelationship: true, temporaryConversationAllowed: true },
        });
        return {
          relationshipId: rid,
          synced: true,
          skipped: false,
          windowId: window.id,
          previousWindowState: prev,
          nextWindowState: fresh?.state,
          requestState: reqRow?.requestState ?? null,
          convertedToRelationship: fresh?.convertedToRelationship,
          temporaryConversationAllowed: fresh?.temporaryConversationAllowed,
          sponsorOrganizationId: window.sponsorOrganizationId,
          targetOrganizationId: window.targetOrganizationId,
          campaignId: window.campaignId,
          emittedEventsCount: 0,
          corridorGovernanceSynced: false,
          corridorGovernanceError: typeof detail === "string" ? detail : JSON.stringify(detail),
          optionalDependencyDiagnostics,
        };
      }

      if (!corridorOutcome.ok) {
        const fresh = await this.prisma.sponsoredConversationWindow.findUnique({
          where: { id: window.id },
          select: { state: true, convertedToRelationship: true, temporaryConversationAllowed: true },
        });
        return {
          relationshipId: rid,
          synced: true,
          skipped: false,
          windowId: window.id,
          previousWindowState: prev,
          nextWindowState: fresh?.state,
          requestState: reqRow?.requestState ?? null,
          convertedToRelationship: fresh?.convertedToRelationship,
          temporaryConversationAllowed: fresh?.temporaryConversationAllowed,
          sponsorOrganizationId: window.sponsorOrganizationId,
          targetOrganizationId: window.targetOrganizationId,
          campaignId: window.campaignId,
          emittedEventsCount: 0,
          corridorGovernanceSynced: false,
          corridorGovernanceError: corridorOutcome.error ?? "sponsored_corridor_outcome_not_ok",
          optionalDependencyDiagnostics,
        };
      }

      await this.analytics.bumpRelationshipAcceptedSynced(undefined, {
        sponsorOrganizationId: window.sponsorOrganizationId,
        campaignId: window.campaignId,
        region: window.regionScope,
        city: window.cityScope,
        district: window.districtScope,
        targetActorType: String(actorType),
      });

      let emitted = 0;
      if (threadId) {
        await this.realtime.publish(threadId, window.sponsorOrganizationId, "sponsored.relationship.accepted_synced", {
          ...buildSponsoredMaintenanceWsBody({
            ...baseCtx,
            relationshipId: rel.id,
            sponsoredScopeValidated: true,
            temporaryCommercialHandshake: false,
            relationshipStillRequired: false,
            previousWindowState: prev,
          }),
        });
        emitted = 1;
      }

      const fresh = await this.prisma.sponsoredConversationWindow.findUnique({
        where: { id: window.id },
        select: { state: true, convertedToRelationship: true, temporaryConversationAllowed: true },
      });

      this.log.log(
        JSON.stringify({
          job: "sponsored_sync_relationship",
          phase: "relationship_synced",
          relationshipId: rid,
          windowId: window.id,
          path: "accepted",
          emittedEventsCount: emitted,
          corridorGovernanceSynced: true,
        }),
      );

      this.trustTouch?.touchOrganizations([window.sponsorOrganizationId, window.targetOrganizationId]);

      return {
        relationshipId: rid,
        synced: true,
        skipped: false,
        windowId: window.id,
        previousWindowState: prev,
        nextWindowState: fresh?.state,
        requestState: reqRow?.requestState ?? null,
        convertedToRelationship: fresh?.convertedToRelationship,
        temporaryConversationAllowed: fresh?.temporaryConversationAllowed,
        sponsorOrganizationId: window.sponsorOrganizationId,
        targetOrganizationId: window.targetOrganizationId,
        campaignId: window.campaignId,
        emittedEventsCount: emitted,
        corridorGovernanceSynced: true,
        corridorStateAfterSync: corridorOutcome.corridorStateAfterSync,
        corridorSignalApplied: corridorOutcome.corridorSignalApplied,
        optionalDependencyDiagnostics,
      };
    }

    if (
      rel.status === RelationshipStatus.REJECTED ||
      rel.status === RelationshipStatus.BLOCKED ||
      rel.status === RelationshipStatus.SUSPENDED
    ) {
      if (window.state === TemporaryCommercialHandshakeState.RELATIONSHIP_REJECTED) {
        const reqRow = await this.prisma.sponsoredRelationshipRequest.findFirst({
          where: { sponsoredConversationWindowId: window.id },
          select: { requestState: true },
        });
        this.log.log(
          JSON.stringify({
            job: "sponsored_sync_relationship",
            phase: "nothing_to_sync",
            relationshipId: rid,
            windowId: window.id,
            reason: "window_already_relationship_rejected",
          }),
        );
        return {
          relationshipId: rid,
          synced: false,
          skipped: true,
          skipReason: "already_synced",
          windowId: window.id,
          previousWindowState: window.state,
          nextWindowState: window.state,
          requestState: reqRow?.requestState ?? null,
          convertedToRelationship: window.convertedToRelationship,
          temporaryConversationAllowed: window.temporaryConversationAllowed,
          sponsorOrganizationId: window.sponsorOrganizationId,
          targetOrganizationId: window.targetOrganizationId,
          campaignId: window.campaignId,
          emittedEventsCount: 0,
        };
      }

      const prev = window.state;
      const count = await this.prisma.sponsoredConversationWindow.updateMany({
        where: {
          id: window.id,
          state: { not: TemporaryCommercialHandshakeState.RELATIONSHIP_REJECTED },
        },
        data: {
          state: TemporaryCommercialHandshakeState.RELATIONSHIP_REJECTED,
          temporaryConversationAllowed: false,
          lastActivityAt: new Date(),
        },
      });
      if (count.count === 0) {
        return {
          relationshipId: rid,
          synced: false,
          skipped: true,
          skipReason: "concurrent_update",
          windowId: window.id,
          emittedEventsCount: 0,
        };
      }

      await this.prisma.sponsoredRelationshipRequest.updateMany({
        where: { sponsoredConversationWindowId: window.id },
        data: { requestState: SponsoredRelationshipRequestState.REJECTED_COMMERCIAL },
      });

      const reqRow = await this.prisma.sponsoredRelationshipRequest.findFirst({
        where: { sponsoredConversationWindowId: window.id },
        select: { requestState: true },
      });

      const optionalDependencyDiagnostics = detectOptionalDependencyStatus({
        sponsoredSyncCorridorGovernanceMissing: !this.corridorGovernance,
        trustProfileRowMissing: false,
        negotiationCorridorPolicyMissing: false,
        cartConversionCorridorPolicyMissing: false,
        corridorRealtimePublisherUnconfigured: false,
        commercialTrustTouchMissing: !this.trustTouch,
      });

      if (process.env.NODE_ENV === "production" && !this.corridorGovernance) {
        this.log.error(
          JSON.stringify({
            job: "sponsored_sync_relationship",
            phase: "corridor_governance_missing_prod_fail_closed",
            relationshipId: rid,
            optionalDependencyMissing: optionalDependencyDiagnostics.optionalDependencyMissing,
          }),
        );
        throw new InternalServerErrorException({
          code: "corridor_governance_required_for_sponsored_sync",
          optionalDependencyMissing: optionalDependencyDiagnostics.optionalDependencyMissing,
        });
      }

      if (!this.corridorGovernance) {
        this.log.warn(
          JSON.stringify({
            job: "sponsored_sync_relationship",
            phase: "corridor_governance_missing_dev",
            relationshipId: rid,
            path: "rejected_or_blocked",
          }),
        );
        const fresh = await this.prisma.sponsoredConversationWindow.findUnique({
          where: { id: window.id },
          select: { state: true, convertedToRelationship: true, temporaryConversationAllowed: true },
        });
        return {
          relationshipId: rid,
          synced: true,
          skipped: false,
          windowId: window.id,
          previousWindowState: prev,
          nextWindowState: fresh?.state,
          requestState: reqRow?.requestState ?? null,
          convertedToRelationship: fresh?.convertedToRelationship,
          temporaryConversationAllowed: fresh?.temporaryConversationAllowed,
          sponsorOrganizationId: window.sponsorOrganizationId,
          targetOrganizationId: window.targetOrganizationId,
          campaignId: window.campaignId,
          emittedEventsCount: 0,
          corridorGovernanceSynced: false,
          corridorGovernanceError: "RelationshipGovernanceService_optional_missing",
          optionalDependencyDiagnostics,
        };
      }

      let corridorOutcome: Awaited<ReturnType<RelationshipGovernanceService["applySponsoredRelationshipOutcome"]>>;
      try {
        corridorOutcome = await this.corridorGovernance.applySponsoredRelationshipOutcome(rid, "rejected");
      } catch (e) {
        const detail = e instanceof BadRequestException ? e.getResponse() : String((e as Error).message);
        this.log.warn(
          JSON.stringify({
            job: "sponsored_sync_relationship",
            phase: "corridor_outcome_failed",
            relationshipId: rid,
            path: "rejected_or_blocked",
            detail,
          }),
        );
        const fresh = await this.prisma.sponsoredConversationWindow.findUnique({
          where: { id: window.id },
          select: { state: true, convertedToRelationship: true, temporaryConversationAllowed: true },
        });
        return {
          relationshipId: rid,
          synced: true,
          skipped: false,
          windowId: window.id,
          previousWindowState: prev,
          nextWindowState: fresh?.state,
          requestState: reqRow?.requestState ?? null,
          convertedToRelationship: fresh?.convertedToRelationship,
          temporaryConversationAllowed: fresh?.temporaryConversationAllowed,
          sponsorOrganizationId: window.sponsorOrganizationId,
          targetOrganizationId: window.targetOrganizationId,
          campaignId: window.campaignId,
          emittedEventsCount: 0,
          corridorGovernanceSynced: false,
          corridorGovernanceError: typeof detail === "string" ? detail : JSON.stringify(detail),
          optionalDependencyDiagnostics,
        };
      }

      if (!corridorOutcome.ok) {
        const fresh = await this.prisma.sponsoredConversationWindow.findUnique({
          where: { id: window.id },
          select: { state: true, convertedToRelationship: true, temporaryConversationAllowed: true },
        });
        return {
          relationshipId: rid,
          synced: true,
          skipped: false,
          windowId: window.id,
          previousWindowState: prev,
          nextWindowState: fresh?.state,
          requestState: reqRow?.requestState ?? null,
          convertedToRelationship: fresh?.convertedToRelationship,
          temporaryConversationAllowed: fresh?.temporaryConversationAllowed,
          sponsorOrganizationId: window.sponsorOrganizationId,
          targetOrganizationId: window.targetOrganizationId,
          campaignId: window.campaignId,
          emittedEventsCount: 0,
          corridorGovernanceSynced: false,
          corridorGovernanceError: corridorOutcome.error ?? "sponsored_corridor_outcome_not_ok",
          optionalDependencyDiagnostics,
        };
      }

      await this.analytics.bumpRelationshipRejectedSynced(undefined, {
        sponsorOrganizationId: window.sponsorOrganizationId,
        campaignId: window.campaignId,
        region: window.regionScope,
        city: window.cityScope,
        district: window.districtScope,
        targetActorType: String(actorType),
      });

      let emitted = 0;
      if (threadId) {
        await this.realtime.publish(threadId, window.sponsorOrganizationId, "sponsored.relationship.rejected_synced", {
          ...buildSponsoredMaintenanceWsBody({
            ...baseCtx,
            relationshipId: rel.id,
            sponsoredScopeValidated: true,
            temporaryCommercialHandshake: true,
            relationshipStillRequired: true,
            previousWindowState: prev,
          }),
          relationshipStatus: rel.status,
        });
        emitted = 1;
      }

      const fresh = await this.prisma.sponsoredConversationWindow.findUnique({
        where: { id: window.id },
        select: { state: true, convertedToRelationship: true, temporaryConversationAllowed: true },
      });

      this.log.log(
        JSON.stringify({
          job: "sponsored_sync_relationship",
          phase: "relationship_synced",
          relationshipId: rid,
          windowId: window.id,
          path: "rejected_or_blocked",
          emittedEventsCount: emitted,
          corridorGovernanceSynced: true,
        }),
      );

      this.trustTouch?.touchOrganizations([window.sponsorOrganizationId, window.targetOrganizationId]);

      return {
        relationshipId: rid,
        synced: true,
        skipped: false,
        windowId: window.id,
        previousWindowState: prev,
        nextWindowState: fresh?.state,
        requestState: reqRow?.requestState ?? null,
        convertedToRelationship: fresh?.convertedToRelationship,
        temporaryConversationAllowed: fresh?.temporaryConversationAllowed,
        sponsorOrganizationId: window.sponsorOrganizationId,
        targetOrganizationId: window.targetOrganizationId,
        campaignId: window.campaignId,
        emittedEventsCount: emitted,
        corridorGovernanceSynced: true,
        corridorStateAfterSync: corridorOutcome.corridorStateAfterSync,
        corridorSignalApplied: corridorOutcome.corridorSignalApplied,
        optionalDependencyDiagnostics,
      };
    }

    this.log.log(
      JSON.stringify({
        job: "sponsored_sync_relationship",
        phase: "sync_skipped",
        relationshipId: rid,
        windowId: window.id,
        reason: "relationship_status_not_terminal_for_sponsored_sync",
        relationshipStatus: rel.status,
      }),
    );

    return {
      relationshipId: rid,
      synced: false,
      skipped: true,
      skipReason: "relationship_pending_or_unhandled",
      windowId: window.id,
      emittedEventsCount: 0,
    };
  }
}
