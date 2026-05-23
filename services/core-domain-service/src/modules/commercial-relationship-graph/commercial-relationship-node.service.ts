import { OrganizationActorType, OrganizationCategory } from "@prisma/client";
import type { CommercialRelationshipNode, CommercialRelationshipNodeRole } from "@venext/shared-contracts";

import { Injectable } from "@nestjs/common";

type OrgRow = {
  id: string;
  commercialId: string;
  displayName: string;
  category: OrganizationCategory;
  actorType: OrganizationActorType;
  city: string;
  country: string;
  commune: string | null;
  verificationStatus: string;
};

export type NodeAdjacency = {
  relationshipCount: number;
  upstreamCount: number;
  downstreamCount: number;
};

@Injectable()
export class CommercialRelationshipNodeService {
  buildNodes(
    centerId: string,
    orgs: Map<string, OrgRow>,
    adjacency: Map<string, NodeAdjacency>,
  ): CommercialRelationshipNode[] {
    const list = [...orgs.values()].sort((a, b) => a.id.localeCompare(b.id));
    const out: CommercialRelationshipNode[] = [];
    for (const o of list) {
      const adj = adjacency.get(o.id) ?? { relationshipCount: 0, upstreamCount: 0, downstreamCount: 0 };
      const nodeRole = this.inferRole(o, adj);
      const activityState =
        adj.relationshipCount === 0 ? ("QUIESCENT" as const) : adj.upstreamCount + adj.downstreamCount === 0 ? "QUIESCENT" : "ACTIVE";
      const commercialWeight = this.weight(adj);
      const territory = [o.country, o.city, o.commune].filter(Boolean).join(" / ").slice(0, 160);
      out.push({
        organizationId: o.id,
        commercialId: o.commercialId,
        displayName: o.displayName,
        category: o.category,
        actorType: o.actorType,
        territory: territory || "UNKNOWN_TERRITORY_LABEL",
        verificationStatus: o.verificationStatus,
        nodeRole,
        activityState: nodeRole === "ISOLATED_NODE" ? "QUIESCENT" : activityState,
        relationshipCount: adj.relationshipCount,
        upstreamCount: adj.upstreamCount,
        downstreamCount: adj.downstreamCount,
        commercialWeight,
        sourceSignals: [
          `org.category=${o.category}`,
          `org.actorType=${o.actorType}`,
          `adj.relationshipCount=${adj.relationshipCount}`,
          `adj.upstreamCount=${adj.upstreamCount}`,
          `adj.downstreamCount=${adj.downstreamCount}`,
          `centerMatch=${o.id === centerId ? "ego" : "partner"}`,
        ],
      });
    }
    return out;
  }

  private weight(adj: NodeAdjacency): number {
    const raw = Math.min(1, adj.relationshipCount / 24 + adj.upstreamCount / 12 + adj.downstreamCount / 12);
    return Number(raw.toFixed(3));
  }

  private inferRole(o: OrgRow, adj: NodeAdjacency): CommercialRelationshipNodeRole {
    if (adj.relationshipCount === 0) return "ISOLATED_NODE";
    if (o.actorType === OrganizationActorType.INDUSTRIAL_PRODUCER) return "INDUSTRIAL_PRODUCER";
    if (o.category === OrganizationCategory.PRODUCER) return "PRODUCER";
    if (o.category === OrganizationCategory.RETAILER) return "RETAILER";
    const bridge =
      (o.category === OrganizationCategory.WHOLESALER_A || o.category === OrganizationCategory.WHOLESALER_B) &&
      adj.upstreamCount >= 2 &&
      adj.downstreamCount >= 2;
    if (bridge) return "DISTRIBUTOR_BRIDGE";
    if (o.category === OrganizationCategory.WHOLESALER_A) return "WHOLESALER_A";
    if (o.category === OrganizationCategory.WHOLESALER_B) return "WHOLESALER_B";
    if (adj.relationshipCount >= 8) return "STRATEGIC_HUB";
    return "UNKNOWN_COMMERCIAL_ROLE";
  }
}
