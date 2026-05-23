import { Injectable } from "@nestjs/common";
import { OrganizationCategory, RelationshipStatus, TemporaryCommercialHandshakeState } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type EligibilityResult = { eligible: boolean; reasons: string[] };

export function geoMatchesScopes(
  org: { country: string; city: string; commune: string | null },
  regionScope: string | null,
  cityScope: string | null,
  districtScope: string | null,
): boolean {
  if (regionScope && regionScope.trim() && org.country !== regionScope.trim()) return false;
  if (cityScope && cityScope.trim() && org.city !== cityScope.trim()) return false;
  if (districtScope && districtScope.trim()) {
    const d = org.commune ?? "";
    if (d !== districtScope.trim()) return false;
  }
  return true;
}

export function categoryMatchesCampaign(
  orgCategory: OrganizationCategory,
  target: OrganizationCategory | null,
): boolean {
  if (!target) return true;
  return orgCategory === target;
}

/**
 * Instruction 20.2 — eligibility for opening a sponsored conversation window.
 */
@Injectable()
export class SponsoredConversationEligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(input: {
    campaignId: string;
    actorOrganizationId: string;
  }): Promise<EligibilityResult> {
    const reasons: string[] = [];
    const camp = await this.prisma.sponsoredCommercialCampaign.findUnique({
      where: { id: input.campaignId },
      include: { product: true, sponsor: true },
    });
    if (!camp || !camp.active) {
      reasons.push("campaign_inactive_or_missing");
      return { eligible: false, reasons };
    }
    const now = new Date();
    if (camp.startsAt > now || camp.endsAt < now) {
      reasons.push("campaign_outside_window");
      return { eligible: false, reasons };
    }
    if (!camp.product.active || !camp.product.sponsorEligible) {
      reasons.push("product_not_sponsor_eligible_or_inactive");
      return { eligible: false, reasons };
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: input.actorOrganizationId },
    });
    if (!org) {
      reasons.push("actor_org_missing");
      return { eligible: false, reasons };
    }
    if (org.id === camp.sponsorOrganizationId) {
      reasons.push("sponsor_cannot_open_as_target");
      return { eligible: false, reasons };
    }

    if (!geoMatchesScopes(org, camp.regionScope, camp.cityScope, camp.districtScope)) {
      reasons.push("geo_scope_mismatch");
      return { eligible: false, reasons };
    }
    if (!categoryMatchesCampaign(org.category, camp.targetActorCategory)) {
      reasons.push("actor_category_mismatch");
      return { eligible: false, reasons };
    }

    const accepted = await this.prisma.relationship.findFirst({
      where: {
        status: RelationshipStatus.ACCEPTED,
        OR: [
          { AND: [{ requesterOrganizationId: org.id }, { receiverOrganizationId: camp.sponsorOrganizationId }] },
          { AND: [{ requesterOrganizationId: camp.sponsorOrganizationId }, { receiverOrganizationId: org.id }] },
          { AND: [{ upstreamOrganizationId: org.id }, { downstreamOrganizationId: camp.sponsorOrganizationId }] },
          { AND: [{ upstreamOrganizationId: camp.sponsorOrganizationId }, { downstreamOrganizationId: org.id }] },
        ],
      },
      select: { id: true },
    });
    if (accepted) {
      reasons.push("already_accepted_relationship_use_corridor");
      return { eligible: false, reasons };
    }

    const priorBad = await this.prisma.relationship.findFirst({
      where: {
        status: { in: [RelationshipStatus.BLOCKED, RelationshipStatus.REJECTED, RelationshipStatus.SUSPENDED] },
        OR: [
          { AND: [{ requesterOrganizationId: org.id }, { receiverOrganizationId: camp.sponsorOrganizationId }] },
          { AND: [{ requesterOrganizationId: camp.sponsorOrganizationId }, { receiverOrganizationId: org.id }] },
          { AND: [{ upstreamOrganizationId: org.id }, { downstreamOrganizationId: camp.sponsorOrganizationId }] },
          { AND: [{ upstreamOrganizationId: camp.sponsorOrganizationId }, { downstreamOrganizationId: org.id }] },
        ],
      },
      select: { id: true, status: true },
    });
    if (priorBad) {
      if (priorBad.status === RelationshipStatus.BLOCKED) {
        reasons.push("prior_relationship_blocked");
      } else {
        reasons.push("prior_relationship_rejected");
      }
      return { eligible: false, reasons };
    }

    const cooldownCut = new Date(Date.now() - camp.cooldownSeconds * 1000);
    const recent = await this.prisma.sponsoredConversationWindow.count({
      where: {
        campaignId: camp.id,
        targetOrganizationId: org.id,
        createdAt: { gte: cooldownCut },
      },
    });
    if (recent > 0) {
      reasons.push("sponsored_open_cooldown_active");
      return { eligible: false, reasons };
    }

    const activeWindows = await this.prisma.sponsoredConversationWindow.count({
      where: {
        sponsorOrganizationId: camp.sponsorOrganizationId,
        targetOrganizationId: org.id,
        expiresAt: { gt: now },
        state: {
          notIn: [
            TemporaryCommercialHandshakeState.SPONSORED_WINDOW_EXPIRED,
            TemporaryCommercialHandshakeState.RELATIONSHIP_REJECTED,
          ],
        },
      },
    });
    if (activeWindows >= camp.maxActiveWindowsPerTarget) {
      reasons.push("max_active_sponsored_windows_reached");
      return { eligible: false, reasons };
    }

    return { eligible: true, reasons: [] };
  }
}
