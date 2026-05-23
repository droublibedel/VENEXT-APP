import { describe, expect, it } from "vitest";
import { OrganizationCategory } from "@prisma/client";

import {
  categoryMatchesCampaign,
  geoMatchesScopes,
} from "./sponsored-conversation-eligibility.service";

describe("Instruction 20.2 — sponsored eligibility helpers", () => {
  it("geoMatchesScopes accepts SN retailer when region is SN", () => {
    expect(
      geoMatchesScopes({ country: "SN", city: "Dakar", commune: null }, "SN", null, null),
    ).toBe(true);
  });

  it("geoMatchesScopes rejects wrong country", () => {
    expect(
      geoMatchesScopes({ country: "CI", city: "Abidjan", commune: null }, "SN", null, null),
    ).toBe(false);
  });

  it("geoMatchesScopes enforces city when campaign scopes city", () => {
    expect(
      geoMatchesScopes({ country: "SN", city: "Dakar", commune: null }, "SN", "Dakar", null),
    ).toBe(true);
    expect(
      geoMatchesScopes({ country: "SN", city: "Thiès", commune: null }, "SN", "Dakar", null),
    ).toBe(false);
  });

  it("categoryMatchesCampaign respects target category", () => {
    expect(categoryMatchesCampaign(OrganizationCategory.RETAILER, OrganizationCategory.RETAILER)).toBe(true);
    expect(categoryMatchesCampaign(OrganizationCategory.WHOLESALER_B, OrganizationCategory.RETAILER)).toBe(false);
    expect(categoryMatchesCampaign(OrganizationCategory.RETAILER, null)).toBe(true);
  });
});
