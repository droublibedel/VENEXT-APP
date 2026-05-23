import { describe, expect, it, vi } from "vitest";

import { postRelationalCartFromCatalog } from "./post-relational-cart-from-catalog";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("Instruction 20.6 — postRelationalCartFromCatalog", () => {
  it("rejects invalid request body before fetch", async () => {
    const out = await postRelationalCartFromCatalog({
      actingOrganizationId: UUID,
      body: { quantity: 0 },
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toBe("invalid_request");
  });

  it("returns invalid_payload when JSON does not match RelationalCartResponseSchema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ unexpected: true }),
      }),
    );
    const out = await postRelationalCartFromCatalog({
      actingOrganizationId: UUID,
      body: {
        relationshipId: "550e8400-e29b-41d4-a716-446655440001",
        sellerOrganizationId: "550e8400-e29b-41d4-a716-446655440002",
        buyerOrganizationId: "550e8400-e29b-41d4-a716-446655440003",
        productId: "550e8400-e29b-41d4-a716-446655440004",
        quantity: 2,
        unit: "kg",
      },
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toBe("invalid_payload");
    vi.unstubAllGlobals();
  });
});
