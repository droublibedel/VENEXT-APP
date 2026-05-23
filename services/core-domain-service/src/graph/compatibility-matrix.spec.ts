import { describe, expect, it } from "vitest";
import { OrganizationCategory } from "@prisma/client";
import {
  canPairCategories,
  validateDirectedEdge,
} from "./compatibility-matrix";

describe("commercial compatibility (Instruction 4)", () => {
  it("blocks retailer ↔ producer pairing by default", () => {
    expect(
      canPairCategories(
        OrganizationCategory.RETAILER,
        OrganizationCategory.PRODUCER,
      ),
    ).toBe(false);
    expect(
      canPairCategories(
        OrganizationCategory.PRODUCER,
        OrganizationCategory.RETAILER,
      ),
    ).toBe(false);
  });

  it("rejects producer-as-supplier to retailer directed edge", () => {
    expect(
      validateDirectedEdge({
        upstreamCategory: OrganizationCategory.PRODUCER,
        downstreamCategory: OrganizationCategory.RETAILER,
      }),
    ).toBe(false);
  });

  it("allows wholesaler B between producer and retailer chain roles", () => {
    expect(
      validateDirectedEdge({
        upstreamCategory: OrganizationCategory.PRODUCER,
        downstreamCategory: OrganizationCategory.WHOLESALER_B,
      }),
    ).toBe(true);
    expect(
      validateDirectedEdge({
        upstreamCategory: OrganizationCategory.WHOLESALER_B,
        downstreamCategory: OrganizationCategory.RETAILER,
      }),
    ).toBe(true);
  });

  it("same wholesaler can be downstream (buyer) from producer and upstream (seller) to retailer", () => {
    const buyerFromProducer = validateDirectedEdge({
      upstreamCategory: OrganizationCategory.PRODUCER,
      downstreamCategory: OrganizationCategory.WHOLESALER_A,
    });
    const sellerToRetailer = validateDirectedEdge({
      upstreamCategory: OrganizationCategory.WHOLESALER_A,
      downstreamCategory: OrganizationCategory.RETAILER,
    });
    expect(buyerFromProducer && sellerToRetailer).toBe(true);
  });
});
