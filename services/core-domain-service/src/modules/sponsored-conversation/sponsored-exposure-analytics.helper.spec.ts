import { describe, expect, it } from "vitest";

import { buildSponsoredExposureAggregationKey } from "./sponsored-exposure-analytics.helper";

describe("Instruction 20.2A — exposure aggregation key", () => {
  it("is stable for identical inputs", () => {
    const a = buildSponsoredExposureAggregationKey({
      campaignId: "c1",
      sponsorOrganizationId: "s1",
      region: "SN",
      city: null,
      district: null,
      targetActorType: "RETAILER",
      eventType: "IMPRESSION",
      dateUtc: "2026-05-15",
    });
    const b = buildSponsoredExposureAggregationKey({
      campaignId: "c1",
      sponsorOrganizationId: "s1",
      region: "SN",
      city: null,
      district: null,
      targetActorType: "RETAILER",
      eventType: "IMPRESSION",
      dateUtc: "2026-05-15",
    });
    expect(a).toBe(b);
  });

  it("separates event types", () => {
    const base = {
      campaignId: "c1",
      sponsorOrganizationId: "s1",
      region: "SN",
      city: null,
      district: null,
      targetActorType: "RETAILER",
      dateUtc: "2026-05-15",
    };
    expect(buildSponsoredExposureAggregationKey({ ...base, eventType: "IMPRESSION" })).not.toEqual(
      buildSponsoredExposureAggregationKey({ ...base, eventType: "OPEN" }),
    );
  });
});
