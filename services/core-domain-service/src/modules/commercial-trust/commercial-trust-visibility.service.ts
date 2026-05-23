import { ForbiddenException, Injectable } from "@nestjs/common";
import {
  TemporaryCommercialHandshakeState,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { OrganizationAccessService } from "../../platform-authz/organization-access.service";
import type { VenextRequestActor } from "../../platform-authz/venext-authz.types";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import { hasAcceptedRelationshipBetween } from "./accepted-commercial-relationship.helper";

/** Instruction 20.3 — private economic trust visibility scopes (not public marketplace). */
export type CommercialTrustVisibilityScope =
  | "SELF_PRIVATE"
  | "ACCEPTED_PARTNER_LIMITED"
  | "SPONSORED_TEMPORARY_MINIMAL"
  | "BACKOFFICE_FULL";

export type CommercialTrustVisibilityDiagnostics = {
  visibilityScope: CommercialTrustVisibilityScope;
  exposedToPartnerCorridor: boolean;
  sponsorTemporaryVisibility: boolean;
  publicMarketplaceExposure: false;
};

@Injectable()
export class CommercialTrustVisibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orgAccess: OrganizationAccessService,
  ) {}

  async assertProfileReadable(actor: VenextRequestActor, subjectOrganizationId: string): Promise<CommercialTrustVisibilityDiagnostics> {
    const subject = subjectOrganizationId.trim();
    if (!subject) throw new ForbiddenException({ code: "commercial_trust_subject_required" });

    if (devAuthBypassEnabled()) {
      return {
        visibilityScope: "BACKOFFICE_FULL",
        exposedToPartnerCorridor: true,
        sponsorTemporaryVisibility: true,
        publicMarketplaceExposure: false,
      };
    }

    if (actor.backofficeCommercialTrustFull) {
      return {
        visibilityScope: "BACKOFFICE_FULL",
        exposedToPartnerCorridor: true,
        sponsorTemporaryVisibility: true,
        publicMarketplaceExposure: false,
      };
    }

    const viewerOrg = actor.organizationId?.trim();
    /** Instruction 20.3A — anonymous / missing acting org is always denied (no NONE full-profile path). */
    if (!viewerOrg) {
      throw new ForbiddenException({
        code: "commercial_trust_visibility_denied",
        detail: "Profil confiance corridor — actingOrganizationId obligatoire.",
      });
    }

    if (viewerOrg === subject) {
      await this.orgAccess.assertMemberOrBypass(actor, subject);
      return {
        visibilityScope: "SELF_PRIVATE",
        exposedToPartnerCorridor: false,
        sponsorTemporaryVisibility: false,
        publicMarketplaceExposure: false,
      };
    }

    await this.orgAccess.assertMemberOrBypass(actor, viewerOrg);

    const partner = await hasAcceptedRelationshipBetween(this.prisma, viewerOrg, subject);
    if (partner) {
      return {
        visibilityScope: "ACCEPTED_PARTNER_LIMITED",
        exposedToPartnerCorridor: true,
        sponsorTemporaryVisibility: false,
        publicMarketplaceExposure: false,
      };
    }

    const sponsorWindow = await this.prisma.sponsoredConversationWindow.findFirst({
      where: {
        state: {
          in: [
            TemporaryCommercialHandshakeState.DISCOVERED,
            TemporaryCommercialHandshakeState.SPONSORED_CONTACT_OPENED,
            TemporaryCommercialHandshakeState.SPONSORED_NEGOTIATION_ACTIVE,
            TemporaryCommercialHandshakeState.RELATIONSHIP_REQUESTED,
          ],
        },
        OR: [
          { sponsorOrganizationId: viewerOrg, targetOrganizationId: subject },
          { sponsorOrganizationId: subject, targetOrganizationId: viewerOrg },
        ],
      },
      select: { id: true },
    });
    if (sponsorWindow) {
      return {
        visibilityScope: "SPONSORED_TEMPORARY_MINIMAL",
        exposedToPartnerCorridor: false,
        sponsorTemporaryVisibility: true,
        publicMarketplaceExposure: false,
      };
    }

    throw new ForbiddenException({
      code: "commercial_trust_profile_not_visible",
      detail: "Profil de confiance relationnelle privé — corridor accepté ou sponsoring actif requis.",
    });
  }

  async assertRelationshipReadable(actor: VenextRequestActor, relationshipId: string): Promise<void> {
    const rid = relationshipId.trim();
    const rel = await this.prisma.relationship.findUnique({
      where: { id: rid },
      select: {
        requesterOrganizationId: true,
        receiverOrganizationId: true,
        upstreamOrganizationId: true,
        downstreamOrganizationId: true,
      },
    });
    if (!rel) throw new ForbiddenException({ code: "relationship_not_found" });
    const viewerOrg = actor.organizationId?.trim();
    if (!viewerOrg && !devAuthBypassEnabled()) {
      throw new ForbiddenException({
        code: "commercial_trust_visibility_denied",
        detail: "Lecture relation confiance — actingOrganizationId obligatoire.",
      });
    }
    if (viewerOrg) {
      await this.orgAccess.assertMemberOrBypass(actor, viewerOrg);
      const parties = new Set(
        [
          rel.requesterOrganizationId,
          rel.receiverOrganizationId,
          rel.upstreamOrganizationId,
          rel.downstreamOrganizationId,
        ].filter(Boolean) as string[],
      );
      if (!parties.has(viewerOrg)) {
        throw new ForbiddenException({ code: "commercial_trust_not_relationship_party" });
      }
    }
  }
}
