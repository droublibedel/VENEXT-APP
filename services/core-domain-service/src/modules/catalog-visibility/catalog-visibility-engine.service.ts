import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { RelationshipStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Closed-network catalog gate — no anonymous browsing (Instruction 9 §8, 9A).
 *
 * Canonical “live” edge status in DB: **ACCEPTED** only (see RELATIONSHIP_STATUS.md).
 * UI may map ACCEPTED → "active" for display; never persist "ACTIVE" as a status.
 */
@Injectable()
export class CatalogVisibilityEngineService {
  constructor(private readonly prisma: PrismaService) {}

  /** @deprecated Use assertRelationshipAcceptedForCatalog — kept for binary compatibility */
  async assertRelationshipActive(relationshipId: string) {
    return this.assertRelationshipAcceptedForCatalog(relationshipId);
  }

  /**
   * Deny catalog unless relationship is ACCEPTED and optional viewer is a party on the edge.
   * PENDING | REJECTED | BLOCKED | SUSPENDED → Forbidden.
   */
  async assertRelationshipAcceptedForCatalog(relationshipId: string, viewerOrganizationId?: string) {
    const rel = await this.prisma.relationship.findUnique({ where: { id: relationshipId } });
    if (!rel) throw new NotFoundException(relationshipId);

    if (rel.status !== RelationshipStatus.ACCEPTED) {
      throw new ForbiddenException({
        code: "catalog_denied_non_accepted",
        canonicalStatus: rel.status,
        /** Presentation hint only — DB value is canonical Prisma enum */
        uiLabel: String(rel.status).toLowerCase(),
      });
    }

    if (viewerOrganizationId) {
      const party =
        rel.upstreamOrganizationId === viewerOrganizationId ||
        rel.downstreamOrganizationId === viewerOrganizationId;
      if (!party) {
        throw new ForbiddenException({
          code: "catalog_denied_viewer_not_party",
          relationshipId,
          viewerOrganizationId,
        });
      }
    }

    return rel;
  }
}
