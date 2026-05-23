import { describe, expect, it } from "vitest";

import {
  classifyCommercialRelationshipGraphStreamItem,
  COMMERCIAL_RELATIONSHIP_GRAPH_REALTIME_CLASS_LABELS,
} from "./commercial-relationship-graph-realtime-classification";

describe("commercial-relationship-graph realtime classification", () => {
  it("classifies when pole or envelope is present", () => {
    expect(
      classifyCommercialRelationshipGraphStreamItem({
        id: "1",
        pole: "COMMERCIAL_RELATIONSHIP_GRAPH",
        priority: "MEDIUM",
        label: "x",
        detail: "d",
        ts: new Date().toISOString(),
        commercialRelationshipGraphRealtimeClass: "DOMAIN_LIVE",
      }),
    ).toBe("DOMAIN_LIVE");
    expect(
      classifyCommercialRelationshipGraphStreamItem({
        id: "2",
        priority: "MEDIUM",
        label: "x",
        detail: "d",
        ts: new Date().toISOString(),
        commercialRelationshipGraphEnvelope: "live.commercial_relationship_graph.relationship.updated",
        commercialRelationshipGraphRealtimeClass: "SYNTHETIC_TICK",
      }),
    ).toBe("SYNTHETIC_TICK");
  });

  it("labels cover all realtime classes", () => {
    expect(Object.keys(COMMERCIAL_RELATIONSHIP_GRAPH_REALTIME_CLASS_LABELS).sort()).toEqual(
      ["DEMO_MIRROR", "DOMAIN_LIVE", "SYNTHETIC_TICK"].sort(),
    );
  });
});
