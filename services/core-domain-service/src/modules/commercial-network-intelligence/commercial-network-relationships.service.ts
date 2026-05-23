import { Injectable } from "@nestjs/common";
import { RelationshipSource, RelationshipStatus } from "@prisma/client";
import {
  COMMERCIAL_NETWORK_RELATIONSHIPS_GRAPH_REUSE_TOKEN,
  type CommercialRelationshipsResponse,
} from "@venext/shared-contracts";
import { CommercialNetworkContext } from "./commercial-network-context.service";

@Injectable()
export class CommercialNetworkRelationshipsService {
  fromContext(ctx: CommercialNetworkContext): CommercialRelationshipsResponse {
    const accepted = ctx.relationships.filter((r) => r.status === RelationshipStatus.ACCEPTED);
    const pending = ctx.relationships.filter((r) => r.status === RelationshipStatus.PENDING).length;
    const suspended = ctx.relationships.filter((r) => r.status === RelationshipStatus.SUSPENDED).length;
    const unstable = accepted.filter((r) => r.trustLevel < 0.45).length;

    const since = Date.now() - 30 * 86400000;
    const qrGrowth = ctx.relationships.filter(
      (r) => r.source === RelationshipSource.QR_RELATIONSHIP_JOIN && r.createdAt.getTime() >= since,
    ).length;
    const contactSyncGrowth = ctx.relationships.filter(
      (r) => r.source === RelationshipSource.PHONE_CONTACT && r.createdAt.getTime() >= since,
    ).length;

    const trusts = accepted.map((r) => r.trustLevel);
    const mid = trusts.length ? trusts.sort((a, b) => a - b)[Math.floor(trusts.length / 2)]! : 0.55;
    const avg = trusts.length ? trusts.reduce((a, b) => a + b, 0) / trusts.length : 0.55;
    const trend = avg > mid + 0.04 ? "rising" : avg < mid - 0.04 ? "declining" : "flat";

    const counterparties = ctx.partnersPack.counterparties.length;
    const commercialDependencyScore = Math.min(1, counterparties === 0 ? 0.2 : accepted.length / (counterparties * 1.4));
    const relationshipStrengthIndex = Math.min(1, avg);

    return {
      generatedAt: ctx.generatedAt,
      organizationId: ctx.organizationId,
      acceptedCount: accepted.length,
      pendingInvitations: pending,
      unstableRelationships: unstable,
      suspendedRelationships: suspended,
      qrRelationshipGrowth30d: qrGrowth,
      contactSyncRelationshipGrowth30d: contactSyncGrowth,
      trustEvolution: { trend, delta: Number((avg - mid).toFixed(3)) },
      commercialDependencyScore: Number(commercialDependencyScore.toFixed(3)),
      relationshipStrengthIndex: Number(relationshipStrengthIndex.toFixed(3)),
      graphReuse: COMMERCIAL_NETWORK_RELATIONSHIPS_GRAPH_REUSE_TOKEN,
      suggestionEngineSample: ctx.suggestionSample
        ? {
            mutualContactClusters: ctx.suggestionSample.mutualContactClusters,
            graphSuggestions: ctx.suggestionSample.graphSuggestions,
          }
        : undefined,
    };
  }
}
