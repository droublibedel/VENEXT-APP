import { describe, expect, it } from "vitest";

import { computeCommercialProximityScore } from "./commercial-proximity-score.js";
import { RelationalFeedPipeline } from "./relational-feed-pipeline.js";

describe("feed geographic proximity B-05", () => {
  it("Yopougon viewer ranks near cluster above distant city", () => {
    const near = computeCommercialProximityScore({
      viewerActivity: "chaussures",
      viewerCity: "Yopougon",
      candidate: {
        id: "1",
        displayName: "G",
        partnerRoleLabel: "G",
        city: "Adjamé",
        activityCategory: "chaussures",
        proximityScore: 0,
      },
    });
    const far = computeCommercialProximityScore({
      viewerActivity: "chaussures",
      viewerCity: "Yopougon",
      candidate: {
        id: "2",
        displayName: "G2",
        partnerRoleLabel: "G",
        city: "Korhogo",
        activityCategory: "chaussures",
        proximityScore: 0,
      },
    });
    expect(near).toBeGreaterThan(far);
  });

  it("pipeline never empty with Yopougon city", () => {
    const page = RelationalFeedPipeline({
      actorId: "a",
      role: "detaillant",
      city: "Yopougon",
      categories: ["chaussures"],
      partnerIds: [],
      partnersPublished: false,
    });
    expect(page.entries.length).toBeGreaterThan(0);
    expect(page.feedEmptyPrevented).toBe(true);
  });
});
