import { ForbiddenException, Injectable } from "@nestjs/common";

import { assertCoreCommerceResource } from "./commerce-access-guard.mapper";
import { assertMessagingAccess as assertMessagingAccessPipeline } from "./messaging-access-guard";

const UX = {
  catalog: "Catalogue non disponible",
  order: "Commande non accessible",
  settlement: "Règlement non autorisé",
  partner: "Accès réservé à ce partenaire",
  relation: "Relation non active",
  offline: "Action indisponible hors connexion",
  wallet: "Règlements disponibles sur votre espace uniquement",
  messaging: "Messagerie non disponible dans ce contexte",
  mail: "Mail professionnel non disponible ici",
} as const;

/** Garde backend commerce-first (Instructions 20.83 / 20.83-A). */
@Injectable()
export class CommerceAccessGuardService {
  assertOrganizationScope(
    viewerOrganizationId: string,
    resourceOrganizationId: string,
    relationshipId?: string,
  ): void {
    if (!viewerOrganizationId || viewerOrganizationId === resourceOrganizationId) return;
    if (relationshipId) return;
    throw new ForbiddenException({ userMessage: UX.partner });
  }

  assertRelationshipActive(relationshipId: string | undefined, status?: string): void {
    if (!relationshipId) return;
    if (status === "REMOVED" || status === "SUSPENDED") {
      throw new ForbiddenException({ userMessage: UX.relation });
    }
    try {
      assertCoreCommerceResource(
        { organizationId: "org", relationshipId, relationshipStatus: status },
        "relationship",
      );
    } catch (e) {
      throw new ForbiddenException({ userMessage: (e as Error).message || UX.relation });
    }
  }

  assertCatalogAccess(relationshipId?: string, organizationId?: string): void {
    if (!relationshipId) {
      throw new ForbiddenException({ userMessage: UX.catalog });
    }
    try {
      assertCoreCommerceResource(
        { organizationId: organizationId ?? "org", relationshipId, relationshipStatus: "ACTIVE" },
        "relational_catalog",
      );
    } catch (e) {
      throw new ForbiddenException({ userMessage: (e as Error).message || UX.catalog });
    }
  }

  assertOrderParties(
    organizationId: string,
    buyerId: string,
    sellerId: string,
    relationshipId?: string,
  ): void {
    if (organizationId === buyerId || organizationId === sellerId) {
      try {
        assertCoreCommerceResource(
          {
            organizationId,
            relationshipId,
            buyerOrganizationId: buyerId,
            sellerOrganizationId: sellerId,
            relationshipStatus: "ACTIVE",
          },
          "order",
        );
      } catch (e) {
        throw new ForbiddenException({ userMessage: (e as Error).message || UX.order });
      }
      return;
    }
    if (relationshipId) return;
    throw new ForbiddenException({ userMessage: UX.order });
  }

  assertWalletAccess(organizationId: string, walletOwnerId: string, relationshipId?: string): void {
    try {
      assertCoreCommerceResource(
        {
          organizationId,
          walletOwnerOrganizationId: walletOwnerId,
          relationshipId,
          relationshipStatus: "ACTIVE",
        },
        "wallet",
      );
    } catch (e) {
      throw new ForbiddenException({ userMessage: (e as Error).message || UX.wallet });
    }
  }

  assertMessagingAccess(input: {
    organizationId: string;
    actorRole?: string;
    relationshipId?: string;
    participantStatus?: "ACTIVE" | "SUSPENDED";
    formal?: boolean;
  }): void {
    assertMessagingAccessPipeline(input);
  }
}
