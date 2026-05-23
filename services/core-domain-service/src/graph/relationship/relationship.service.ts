import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import {
  OrganizationCategory,
  RelationshipSource,
  RelationshipStatus,
} from "@prisma/client";
import type {
  CommercialIdPreviewDto,
  InviteByCommercialIdDto,
  InviteByCommercialIdResponseDto,
  RelationshipDecisionDto,
  RelationshipInviteDto,
  RelationshipPreviewDto,
} from "@venext/shared-contracts";
import {
  isValidCommercialIdFormat,
  normalizeCommercialId,
} from "../../organizations/commercial-id";
import { PrismaService } from "../../prisma/prisma.service";
import {
  canPairCategories,
  validateDirectedEdge,
} from "../compatibility-matrix";
import { GraphSignalsService } from "../graph-signals.service";
import { CatalogVisibilityResolverService } from "../catalog-visibility/catalog-visibility-resolver.service";
import { RelationshipRepository } from "./relationship.repository";
import { RelationshipGovernanceService } from "../../modules/relationship-governance/relationship-governance.service";
import { CommercialTrustTouchService } from "../../modules/commercial-trust/commercial-trust-touch.service";

@Injectable()
export class RelationshipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: RelationshipRepository,
    private readonly signals: GraphSignalsService,
    private readonly visibility: CatalogVisibilityResolverService,
    @Optional() private readonly trustTouch?: CommercialTrustTouchService,
    @Optional() private readonly corridorGovernance?: RelationshipGovernanceService,
  ) {}

  private categoriesCompatible(a: OrganizationCategory, b: OrganizationCategory) {
    return (
      canPairCategories(a, b) ||
      canPairCategories(b, a)
    );
  }

  async invite(dto: RelationshipInviteDto) {
    const requester = await this.prisma.organization.findUnique({
      where: { id: dto.requesterOrganizationId },
    });
    const receiver = await this.prisma.organization.findUnique({
      where: { id: dto.receiverOrganizationId },
    });
    if (!requester || !receiver) {
      throw new BadRequestException("unknown_organization");
    }
    if (
      !this.categoriesCompatible(requester.category, receiver.category)
    ) {
      throw new BadRequestException("commercial_categories_incompatible");
    }

    const dup = await this.repo.findPendingBetweenOrgPair(
      dto.requesterOrganizationId,
      dto.receiverOrganizationId,
    );
    if (dup) throw new ConflictException("pending_invitation_exists");

    const existingAccepted = await this.repo.acceptedBetween(
      dto.requesterOrganizationId,
      dto.receiverOrganizationId,
    );
    if (existingAccepted) {
      throw new ConflictException("relationship_already_active");
    }

    const sourceMap: Record<
      RelationshipInviteDto["source"],
      RelationshipSource
    > = {
      MANUAL_INVITATION: RelationshipSource.MANUAL_INVITATION,
      PHONE_CONTACT: RelationshipSource.PHONE_CONTACT,
      NETWORK_CODE: RelationshipSource.NETWORK_CODE,
    };

    const rel = await this.repo.createInvite({
      requester: { connect: { id: dto.requesterOrganizationId } },
      receiver: { connect: { id: dto.receiverOrganizationId } },
      status: RelationshipStatus.PENDING,
      source: sourceMap[dto.source] as RelationshipSource,
      ...(dto.proposedDirection
        ? {
            upstreamOrg: {
              connect: { id: dto.proposedDirection.upstreamOrganizationId },
            },
            downstreamOrg: {
              connect: { id: dto.proposedDirection.downstreamOrganizationId },
            },
          }
        : {}),
    });

    await this.signals.invitationSent(rel.id, dto.requesterOrganizationId);
    return rel;
  }

  /**
   * Relationship request addressed by public 10-digit commercialId (receiver resolved).
   */
  async inviteByCommercialId(
    dto: InviteByCommercialIdDto,
  ): Promise<InviteByCommercialIdResponseDto> {
    if (!isValidCommercialIdFormat(dto.targetCommercialId)) {
      throw new BadRequestException("invalid_commercial_id_format");
    }
    const cm = normalizeCommercialId(dto.targetCommercialId);

    const target = await this.prisma.organization.findUnique({
      where: { commercialId: cm },
      select: {
        id: true,
        commercialId: true,
        displayName: true,
        activityLabel: true,
        actorType: true,
        category: true,
        profileImageUrl: true,
        credibilityScore: true,
      },
    });
    if (!target) throw new NotFoundException("commercial_id_not_found");
    if (target.id === dto.requesterOrganizationId) {
      throw new BadRequestException("self_invitation_not_allowed");
    }

    const rel = await this.invite({
      requesterOrganizationId: dto.requesterOrganizationId,
      receiverOrganizationId: target.id,
      source: "MANUAL_INVITATION",
    });

    const targetPreview: CommercialIdPreviewDto = {
      commercialId: target.commercialId,
      organizationName: target.displayName,
      activityLabel: target.activityLabel,
      actorType: target.actorType,
      category: target.category,
      profileImageUrl: target.profileImageUrl ?? undefined,
      credibilityScore: target.credibilityScore,
    };

    return {
      status: rel.status,
      relationshipId: rel.id,
      targetPreview,
    };
  }

  async accept(
    relationshipId: string,
    body: RelationshipDecisionDto,
    actingOrganizationId: string,
  ) {
    const rel = await this.repo.findById(relationshipId);
    if (!rel) throw new NotFoundException(relationshipId);
    if (rel.status !== RelationshipStatus.PENDING) {
      throw new BadRequestException("relationship_not_pending");
    }
    if (rel.receiverOrganizationId !== actingOrganizationId) {
      throw new ForbiddenException("only_receiver_can_accept");
    }

    const upstream = await this.prisma.organization.findUnique({
      where: { id: body.upstreamOrganizationId },
    });
    const downstream = await this.prisma.organization.findUnique({
      where: { id: body.downstreamOrganizationId },
    });
    if (!upstream || !downstream) {
      throw new BadRequestException("unknown_organization_in_direction");
    }

    if (
      !validateDirectedEdge({
        upstreamCategory: upstream.category,
        downstreamCategory: downstream.category,
      })
    ) {
      throw new BadRequestException("invalid_commercial_direction");
    }

    const updated = await this.repo.update(relationshipId, {
      status: RelationshipStatus.ACCEPTED,
      acceptedAt: new Date(),
      upstreamOrg: { connect: { id: body.upstreamOrganizationId } },
      downstreamOrg: { connect: { id: body.downstreamOrganizationId } },
    });

    await this.signals.invitationAccepted(relationshipId, actingOrganizationId);
    this.trustTouch?.touchOrganizations([
      updated.requesterOrganizationId,
      updated.receiverOrganizationId,
      body.upstreamOrganizationId,
      body.downstreamOrganizationId,
    ]);
    void this.corridorGovernance?.syncCorridorLifecycleFromGraph(relationshipId);
    return updated;
  }

  async reject(relationshipId: string, actingOrganizationId: string) {
    const rel = await this.repo.findById(relationshipId);
    if (!rel) throw new NotFoundException(relationshipId);
    if (rel.receiverOrganizationId !== actingOrganizationId) {
      throw new ForbiddenException("only_receiver_can_reject");
    }
    const out = await this.repo.update(relationshipId, {
      status: RelationshipStatus.REJECTED,
      rejectedAt: new Date(),
    });
    this.trustTouch?.touchOrganizations([out.requesterOrganizationId, out.receiverOrganizationId]);
    void this.corridorGovernance?.syncCorridorLifecycleFromGraph(relationshipId);
    return out;
  }

  async block(relationshipId: string, actingOrganizationId: string) {
    const rel = await this.repo.findById(relationshipId);
    if (!rel) throw new NotFoundException(relationshipId);
    const participant =
      rel.requesterOrganizationId === actingOrganizationId ||
      rel.receiverOrganizationId === actingOrganizationId;
    if (!participant) throw new ForbiddenException("not_participant");
    const out = await this.repo.update(relationshipId, {
      status: RelationshipStatus.BLOCKED,
      rejectedAt: new Date(),
    });
    this.trustTouch?.touchOrganizations([out.requesterOrganizationId, out.receiverOrganizationId]);
    void this.corridorGovernance?.syncCorridorLifecycleFromGraph(relationshipId);
    return out;
  }

  async profilePreview(
    relationshipId: string,
    viewerOrganizationId: string,
  ): Promise<RelationshipPreviewDto> {
    const rel = await this.repo.findById(relationshipId);
    if (!rel) throw new NotFoundException(relationshipId);

    const peerOrg =
      viewerOrganizationId === rel.receiverOrganizationId
        ? rel.requester
        : viewerOrganizationId === rel.requesterOrganizationId
          ? rel.receiver
          : null;
    if (!peerOrg) {
      throw new ForbiddenException("viewer_not_party_to_relationship");
    }

    await this.signals.catalogPreviewViewed(viewerOrganizationId, peerOrg.id);

    const catalogCount = await this.prisma.catalog.count({
      where: { organizationId: peerOrg.id, active: true },
    });

    let sampleProducts: RelationshipPreviewDto["sampleProducts"] = [];
    if (rel.status === RelationshipStatus.ACCEPTED) {
      const firstCatalog = await this.prisma.catalog.findFirst({
        where: { organizationId: peerOrg.id, active: true },
      });
      if (firstCatalog) {
        const vis = await this.visibility.canViewCatalog(
          viewerOrganizationId,
          firstCatalog.id,
        );
        if (vis.allowed) {
          sampleProducts = (
            await this.prisma.product.findMany({
              where: {
                organizationId: peerOrg.id,
                active: true,
              },
              take: 3,
              select: { id: true, name: true, category: true },
            })
          ).map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
          }));
        }
      }
    }

    return {
      organization: {
        id: peerOrg.id,
        commercialId: peerOrg.commercialId,
        displayName: peerOrg.displayName,
        activityLabel: peerOrg.activityLabel,
        actorType: peerOrg.actorType,
        category: peerOrg.category,
        verificationStatus: peerOrg.verificationStatus,
        credibilityScore: peerOrg.credibilityScore,
        city: peerOrg.city,
        commune: peerOrg.commune,
        country: peerOrg.country,
        profileImageUrl: peerOrg.profileImageUrl,
        badges: [],
      },
      catalogPreviewCount: catalogCount,
      sampleProducts,
      relationshipSource: rel.source,
      signalReasons: [
        rel.source === RelationshipSource.NETWORK_CODE
          ? "network_code"
          : "relationship_graph",
      ],
    };
  }

  listReceived = (organizationId: string) =>
    this.repo.listReceivedPending(organizationId);

  listSent = (organizationId: string) =>
    this.repo.listSentPending(organizationId);

  listActive = (organizationId: string) =>
    this.repo.listActive(organizationId);

  findOne = (id: string) => this.repo.findById(id);
}
