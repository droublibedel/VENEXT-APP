import { describe, expect, it } from "vitest";

import {
  OFFICIAL_RELATIONSHIP_MATRIX,
  isRelationshipAllowed,
  isRelationshipConditional,
  relationshipAllowance,
  resolveCommercialRelationshipType,
} from "./commercial-relationship-matrix";

describe("commercial relationship matrix (20.75)", () => {
  it("resolves Producteur ↔ Grossiste A", () => {
    expect(
      resolveCommercialRelationshipType({ self: "producteur", partner: "grossiste_a" }),
    ).toBe("PRODUCTEUR_GROSSISTE_A");
    expect(isRelationshipAllowed({ self: "producteur", partner: "grossiste_a" })).toBe(true);
  });

  it("resolves Producteur ↔ Grossiste B", () => {
    expect(
      resolveCommercialRelationshipType({ self: "grossiste_b", partner: "producteur" }),
    ).toBe("PRODUCTEUR_GROSSISTE_B");
  });

  it("resolves Grossiste A ↔ Grossiste A", () => {
    expect(
      resolveCommercialRelationshipType({ self: "grossiste_a", partner: "grossiste_a" }),
    ).toBe("GROSSISTE_A_GROSSISTE_A");
  });

  it("resolves Grossiste A ↔ Grossiste B", () => {
    expect(
      resolveCommercialRelationshipType({ self: "grossiste_a", partner: "grossiste_b" }),
    ).toBe("GROSSISTE_A_GROSSISTE_B");
  });

  it("resolves Grossiste B ↔ Grossiste B", () => {
    expect(
      resolveCommercialRelationshipType({ self: "grossiste_b", partner: "grossiste_b" }),
    ).toBe("GROSSISTE_B_GROSSISTE_B");
  });

  it("resolves Grossiste ↔ Détaillant", () => {
    expect(
      resolveCommercialRelationshipType({ self: "grossiste_b", partner: "detaillant" }),
    ).toBe("GROSSISTE_DETAILLANT");
    expect(
      resolveCommercialRelationshipType({ self: "grossiste_a", partner: "detaillant" }),
    ).toBe("GROSSISTE_DETAILLANT");
  });

  it("resolves Détaillant ↔ Détaillant", () => {
    expect(
      resolveCommercialRelationshipType({ self: "detaillant", partner: "detaillant" }),
    ).toBe("DETAILLANT_DETAILLANT");
  });

  it("Producteur ↔ Détaillant is conditional", () => {
    const pair = { self: "producteur", partner: "detaillant" };
    expect(resolveCommercialRelationshipType(pair)).toBe("PRODUCTEUR_DETAILLANT");
    expect(isRelationshipConditional(pair)).toBe(true);
    expect(relationshipAllowance(pair)).toBe("conditional");
  });

  it("Producteur ↔ Producteur is optional", () => {
    expect(relationshipAllowance({ self: "producteur", partner: "producteur" })).toBe("optional");
  });

  it("official matrix has nine entries", () => {
    expect(OFFICIAL_RELATIONSHIP_MATRIX.length).toBe(9);
  });

  it("unknown pair is not allowed", () => {
    expect(isRelationshipAllowed({ self: "producteur", partner: "producteur" })).toBe(true);
    expect(resolveCommercialRelationshipType({ self: "producteur", partner: "producteur" })).toBe(
      "PRODUCTEUR_PRODUCTEUR",
    );
  });

  it("symmetric resolution regardless of self/partner order", () => {
    const a = resolveCommercialRelationshipType({ self: "grossiste_b", partner: "grossiste_a" });
    const b = resolveCommercialRelationshipType({ self: "grossiste_a", partner: "grossiste_b" });
    expect(a).toBe(b);
    expect(a).toBe("GROSSISTE_A_GROSSISTE_B");
  });
});
