import { describe, expect, it } from "vitest";

import {
  buildRelationshipDirectionWhere,
  buildRelationshipEndpointMap,
  orderMatchesRelationshipEndpoints,
} from "./relational-orders-relationship-endpoints";

describe("Instruction 20.0A — relationship direction endpoints", () => {
  const rid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const up = "11111111-1111-1111-1111-111111111111";
  const down = "22222222-2222-2222-2222-222222222222";
  const edges = [{ relationshipId: rid, upstreamOrganizationId: up, downstreamOrganizationId: down }];

  it("orderMatchesRelationshipEndpoints accepts buyer=downstream seller=upstream", () => {
    const m = buildRelationshipEndpointMap(edges);
    expect(orderMatchesRelationshipEndpoints(rid, down, up, m)).toBe(true);
  });

  it("orderMatchesRelationshipEndpoints accepts swapped buyer/seller when endpoints match", () => {
    const m = buildRelationshipEndpointMap(edges);
    expect(orderMatchesRelationshipEndpoints(rid, up, down, m)).toBe(true);
  });

  it("orderMatchesRelationshipEndpoints rejects wrong third party as buyer", () => {
    const m = buildRelationshipEndpointMap(edges);
    const intruder = "99999999-9999-9999-9999-999999999999";
    expect(orderMatchesRelationshipEndpoints(rid, intruder, up, m)).toBe(false);
  });

  it("buildRelationshipDirectionWhere wraps both orientations per relationship", () => {
    const m = buildRelationshipEndpointMap(edges);
    const w = buildRelationshipDirectionWhere([rid], m);
    expect(w).toEqual({
      OR: [
        {
          AND: [
            { relationshipId: rid },
            {
              OR: [
                { AND: [{ buyerOrganizationId: down }, { sellerOrganizationId: up }] },
                { AND: [{ buyerOrganizationId: up }, { sellerOrganizationId: down }] },
              ],
            },
          ],
        },
      ],
    });
  });
});
