/**
 * Instruction 19.1A — LEGACY NETWORK TRAVERSER (NOT the official graph bundle engine).
 *
 * Official source of truth for the **materialized commercial relationship graph** (bundle, nodes,
 * edges, diagnostics) is `CommercialRelationshipGraphEngineService` in
 * `modules/commercial-relationship-graph/`.
 *
 * This service retains **narrow operational helpers** used by relational-commerce HTTP routes and
 * sponsored injection hop checks: `partners`, `traverseNetwork`, `shortestPathHops`, `createQrJoinInvite`.
 * It reads Prisma directly and does not duplicate bundle materialization logic.
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  OrganizationCategory,
  RelationshipSource,
  RelationshipStatus,
} from "@prisma/client";
import { isValidCommercialIdFormat, normalizeCommercialId } from "../../organizations/commercial-id";
import { PrismaService } from "../../prisma/prisma.service";
import { canPairCategories, validateDirectedEdge } from "../../graph/compatibility-matrix";

@Injectable()
export class RelationalCommerceNetworkTraverserService {
  constructor(private readonly prisma: PrismaService) {}

  async partners(organizationId: string) {
    const rels = await this.prisma.relationship.findMany({
      where: {
        status: RelationshipStatus.ACCEPTED,
        OR: [{ upstreamOrganizationId: organizationId }, { downstreamOrganizationId: organizationId }],
      },
      orderBy: { acceptedAt: "desc" },
      take: 200,
    });
    const orgIds = new Set<string>();
    for (const r of rels) {
      if (r.upstreamOrganizationId === organizationId && r.downstreamOrganizationId) {
        orgIds.add(r.downstreamOrganizationId);
      } else if (r.downstreamOrganizationId === organizationId && r.upstreamOrganizationId) {
        orgIds.add(r.upstreamOrganizationId);
      }
    }
    const orgs = await this.prisma.organization.findMany({
      where: { id: { in: [...orgIds] } },
      select: {
        id: true,
        displayName: true,
        commercialId: true,
        category: true,
        actorType: true,
        city: true,
        country: true,
        commercialBadges: true,
        credibilityScore: true,
      },
    });
    return { organizationId, edges: rels, counterparties: orgs };
  }

  async traverseNetwork(startOrganizationId: string, maxDepth = 2, maxNodes = 500) {
    const visited = new Set<string>([startOrganizationId]);
    const trail: { organizationId: string; depth: number; viaRelationshipId: string; trustLevel: number }[] = [];
    let frontier: string[] = [startOrganizationId];
    let exploredEdges = 0;
    let truncated = false;

    for (let layer = 0; layer < maxDepth && frontier.length && !truncated; layer++) {
      if (visited.size >= maxNodes) {
        truncated = true;
        break;
      }
      const rels = await this.prisma.relationship.findMany({
        where: {
          status: RelationshipStatus.ACCEPTED,
          OR: [{ upstreamOrganizationId: { in: frontier } }, { downstreamOrganizationId: { in: frontier } }],
        },
        take: 600,
      });
      exploredEdges += rels.length;

      const discovered = new Map<string, { viaRelationshipId: string; trustLevel: number }>();
      for (const node of frontier) {
        for (const r of rels) {
          const other =
            r.upstreamOrganizationId === node
              ? r.downstreamOrganizationId
              : r.downstreamOrganizationId === node
                ? r.upstreamOrganizationId
                : null;
          if (!other || visited.has(other) || discovered.has(other)) continue;
          discovered.set(other, { viaRelationshipId: r.id, trustLevel: r.trustLevel });
        }
      }

      const nextFrontier: string[] = [];
      for (const [id, meta] of discovered) {
        if (visited.size >= maxNodes) {
          truncated = true;
          break;
        }
        visited.add(id);
        trail.push({
          organizationId: id,
          depth: layer + 1,
          viaRelationshipId: meta.viaRelationshipId,
          trustLevel: meta.trustLevel,
        });
        nextFrontier.push(id);
      }
      frontier = nextFrontier;
    }

    return {
      startOrganizationId,
      maxDepth,
      visitedCount: visited.size,
      visitedNodes: [...visited],
      exploredEdges,
      truncated,
      trail,
    };
  }

  /**
   * Shortest hop distance along ACCEPTED edges (undirected hop for B2B graph).
   * Returns null if `to` is not reachable within `maxHopsAllowed` hops from `from`.
   */
  async shortestPathHops(
    fromOrganizationId: string,
    toOrganizationId: string,
    maxHopsAllowed: number,
  ): Promise<number | null> {
    if (fromOrganizationId === toOrganizationId) return 0;
    const visited = new Set<string>([fromOrganizationId]);
    let frontier: string[] = [fromOrganizationId];
    let depth = 0;

    while (frontier.length && depth < maxHopsAllowed) {
      const rels = await this.prisma.relationship.findMany({
        where: {
          status: RelationshipStatus.ACCEPTED,
          OR: [{ upstreamOrganizationId: { in: frontier } }, { downstreamOrganizationId: { in: frontier } }],
        },
        take: 400,
      });
      const nextSet = new Set<string>();
      for (const node of frontier) {
        for (const r of rels) {
          const other =
            r.upstreamOrganizationId === node
              ? r.downstreamOrganizationId
              : r.downstreamOrganizationId === node
                ? r.upstreamOrganizationId
                : null;
          if (!other || visited.has(other)) continue;
          if (other === toOrganizationId) return depth + 1;
          nextSet.add(other);
        }
      }
      if (nextSet.size === 0) return null;
      for (const n of nextSet) visited.add(n);
      frontier = [...nextSet];
      depth += 1;
    }
    return null;
  }

  async createQrJoinInvite(input: {
    requesterOrganizationId: string;
    targetCommercialNetworkId: string;
    upstreamOrganizationId: string;
    downstreamOrganizationId: string;
  }) {
    if (!isValidCommercialIdFormat(input.targetCommercialNetworkId)) {
      throw new BadRequestException("invalid_commercial_network_id");
    }
    const cm = normalizeCommercialId(input.targetCommercialNetworkId);
    const receiver = await this.prisma.organization.findUnique({ where: { commercialId: cm } });
    if (!receiver) throw new NotFoundException("target_organization");

    const requester = await this.prisma.organization.findUnique({
      where: { id: input.requesterOrganizationId },
    });
    if (!requester) throw new NotFoundException("requester");

    if (
      !canPairCategories(requester.category, receiver.category) &&
      !canPairCategories(receiver.category, requester.category)
    ) {
      throw new BadRequestException("categories_incompatible");
    }

    const up = await this.prisma.organization.findUnique({ where: { id: input.upstreamOrganizationId } });
    const down = await this.prisma.organization.findUnique({ where: { id: input.downstreamOrganizationId } });
    if (!up || !down) throw new BadRequestException("edge_orgs_missing");
    if (
      !validateDirectedEdge({
        upstreamCategory: up.category,
        downstreamCategory: down.category,
      })
    ) {
      throw new BadRequestException("directed_edge_invalid");
    }

    const dup = await this.prisma.relationship.findFirst({
      where: {
        OR: [
          {
            requesterOrganizationId: input.requesterOrganizationId,
            receiverOrganizationId: receiver.id,
            status: RelationshipStatus.PENDING,
          },
          {
            requesterOrganizationId: receiver.id,
            receiverOrganizationId: input.requesterOrganizationId,
            status: RelationshipStatus.PENDING,
          },
        ],
      },
    });
    if (dup) throw new ConflictException("pending_exists");

    return this.prisma.relationship.create({
      data: {
        requesterOrganizationId: input.requesterOrganizationId,
        receiverOrganizationId: receiver.id,
        status: RelationshipStatus.PENDING,
        source: RelationshipSource.QR_RELATIONSHIP_JOIN,
        upstreamOrganizationId: input.upstreamOrganizationId,
        downstreamOrganizationId: input.downstreamOrganizationId,
        commerceCategory: `${up.category}->${down.category}`,
        trustLevel: 0.5,
      },
    });
  }
}
