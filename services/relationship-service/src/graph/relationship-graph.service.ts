import { Injectable } from "@nestjs/common";

/**
 * Relational commerce graph — catalog visibility is edge-mediated only.
 * No open-market listing: partner approval + `product_visibility` rows gate SKUs.
 */
@Injectable()
export class RelationshipGraphService {
  visibilityPrinciple() {
    return {
      openCatalog: false,
      exposurePath: ["invitation", "approval", "relationship_edge"],
      contactSignals: ["CONTACT_SYNC_SUGGESTION", "SHARED_GRAPH_HINT"],
    };
  }
}
