import { Injectable } from "@nestjs/common";
import {
  CatalogVisibilityMode,
  RelationshipStatus,
} from "@prisma/client";
import type { CatalogVisibilityResultDto } from "@venext/shared-contracts";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CatalogVisibilityResolverService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * RULE R1: catalog browse requires ACCEPTED relationship with catalog owner,
   * unless owner viewing own catalog; sponsored/product-level overrides handled separately.
   */
  async canViewCatalog(
    viewerOrganizationId: string,
    catalogId: string,
  ): Promise<CatalogVisibilityResultDto> {
    const catalog = await this.prisma.catalog.findUnique({
      where: { id: catalogId },
      include: { organization: true },
    });

    if (!catalog || !catalog.active) {
      return { allowed: false, reason: "catalog_missing_or_inactive" };
    }

    const ownerId = catalog.organizationId;

    if (viewerOrganizationId === ownerId) {
      return {
        allowed: true,
        reason: "catalog_owner",
        visibilityMode: catalog.visibilityMode,
      };
    }

    if (catalog.visibilityMode === CatalogVisibilityMode.INTERNAL_ONLY) {
      return {
        allowed: false,
        reason: "internal_only_catalog",
        visibilityMode: catalog.visibilityMode,
      };
    }

    const edge = await this.prisma.relationship.findFirst({
      where: {
        status: RelationshipStatus.ACCEPTED,
        OR: [
          {
            upstreamOrganizationId: ownerId,
            downstreamOrganizationId: viewerOrganizationId,
          },
          {
            upstreamOrganizationId: viewerOrganizationId,
            downstreamOrganizationId: ownerId,
          },
        ],
      },
    });

    if (!edge) {
      return {
        allowed: false,
        reason: "no_accepted_relationship",
        visibilityMode: catalog.visibilityMode,
      };
    }

    return {
      allowed: true,
      reason: "accepted_relationship",
      relationshipId: edge.id,
      visibilityMode: catalog.visibilityMode,
    };
  }
}
