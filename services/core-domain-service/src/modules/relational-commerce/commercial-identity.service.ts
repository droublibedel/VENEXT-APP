import { Injectable, NotFoundException } from "@nestjs/common";
import {
  OrganizationActorType,
  OrganizationCategory,
  OrganizationVerificationStatus,
  RelationshipStatus,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

function contextualActorLabel(category: OrganizationCategory, actorType: OrganizationActorType): string {
  if (actorType === OrganizationActorType.INDUSTRIAL_PRODUCER || category === OrganizationCategory.PRODUCER) {
    return "PRODUCER_MANUFACTURER";
  }
  if (category === OrganizationCategory.WHOLESALER_A) return "WHOLESALER_A";
  if (category === OrganizationCategory.WHOLESALER_B) return "WHOLESALER_B";
  if (category === OrganizationCategory.RETAILER) return "RETAILER";
  return `${actorType}:${category}`;
}

/**
 * Commercial identity — LinkedIn-shaped commerce card, not consumer profile (Instruction 9 §14–15).
 */
@Injectable()
export class CommercialIdentityService {
  constructor(private readonly prisma: PrismaService) {}

  async profile(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        owner: { select: { preferredLanguage: true, fullName: true } },
        wallets: { take: 3, select: { currency: true, status: true } },
      },
    });
    if (!org) throw new NotFoundException(organizationId);

    const partnerCount = await this.prisma.relationship.count({
      where: {
        status: RelationshipStatus.ACCEPTED,
        OR: [{ upstreamOrganizationId: organizationId }, { downstreamOrganizationId: organizationId }],
      },
    });

    const pendingCount = await this.prisma.relationship.count({
      where: {
        status: RelationshipStatus.PENDING,
        OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
      },
    });

    /** Commercial “following” — distinct upstream suppliers this org buys from (ACCEPTED, org is downstream). */
    const followingCount = await this.prisma.relationship.count({
      where: { status: RelationshipStatus.ACCEPTED, downstreamOrganizationId: organizationId },
    });

    /** Commercial “followers” — distinct downstream partners this org supplies (ACCEPTED, org is upstream). */
    const followerCount = await this.prisma.relationship.count({
      where: { status: RelationshipStatus.ACCEPTED, upstreamOrganizationId: organizationId },
    });

    const trustRows = await this.prisma.relationship.findMany({
      where: {
        status: RelationshipStatus.ACCEPTED,
        OR: [{ upstreamOrganizationId: organizationId }, { downstreamOrganizationId: organizationId }],
      },
      select: { trustLevel: true },
    });
    const relationshipTrustLevel =
      trustRows.length > 0
        ? trustRows.reduce((a, r) => a + r.trustLevel, 0) / trustRows.length
        : null;

    const badges = [...org.commercialBadges];
    if (org.verificationStatus === OrganizationVerificationStatus.VERIFIED && !badges.includes("VERIFIED")) {
      badges.unshift("VERIFIED");
    }

    return {
      organizationId: org.id,
      /** Instruction 9 §6 — 10-digit network id (immutable public handle) */
      commercialNetworkId: org.commercialId,
      /** Same as commercialNetworkId — explicit alias for clients / copy UX */
      commercialId: org.commercialId,
      copyableCommercialId: org.commercialId,
      displayName: org.displayName,
      activityLabel: org.activityLabel,
      contextualRole: contextualActorLabel(org.category, org.actorType),
      category: org.category,
      actorType: org.actorType,
      city: org.city,
      country: org.country,
      commune: org.commune ?? null,
      credibilityScore: org.credibilityScore,
      verificationStatus: org.verificationStatus,
      commercialBadges: badges,
      /** Alias — commercial credibility badges (not social). */
      badges,
      ownerPreferredLanguage: org.owner.preferredLanguage,
      partnerCount,
      followingCount,
      followerCount,
      relationshipTrustLevel,
      pendingInvitations: pendingCount,
      paymentSurface: org.wallets.map((w) => `${w.currency}:${w.status}`),
      /** Dual-role commerce: same org can buy upstream & sell downstream via distinct edges */
      dualMarketplaceNote:
        org.category === OrganizationCategory.WHOLESALER_A ||
        org.category === OrganizationCategory.WHOLESALER_B
          ? "Wholesaler context: separate upstream purchase vs downstream distribution edges."
          : null,
    };
  }
}
