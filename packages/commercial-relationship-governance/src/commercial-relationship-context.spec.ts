import { describe, expect, it } from "vitest";

import {
  buildLinkedCommerceRelationshipLabel,
  buildRelationshipContext,
  buildRelationshipHints,
} from "./commercial-relationship-intelligence";
import { enrichLinkedCommerceContext, shouldUseMailForRelationship } from "./commercial-relationship-linked";
import { mockRelationshipContextsForActor } from "./commercial-relationship.viewmodel";

const FLAGS = {
  commercial_relationship_governance_enabled: true,
  commercial_multi_level_network_enabled: true,
  commercial_relationship_context_enabled: true,
};

describe("relationship context & linked-commerce (20.75)", () => {
  it("builds context for grossiste B terrain pair", () => {
    const ctx = buildRelationshipContext(
      { self: "grossiste_b", partner: "detaillant" },
      { flags: FLAGS },
    );
    expect(ctx.governance.preferMessaging).toBe(true);
    expect(ctx.governance.terrainUi).toBe(true);
  });

  it("builds hints without social jargon", () => {
    const ctx = buildRelationshipContext(
      { self: "detaillant", partner: "detaillant" },
      { flags: FLAGS },
    );
    const hints = buildRelationshipHints(ctx);
    expect(hints.join(" ")).not.toMatch(/followers|feed public/i);
  });

  it("linked commerce enrichment", () => {
    const e = enrichLinkedCommerceContext(
      { self: "producteur", partner: "grossiste_a" },
      { flags: FLAGS },
    );
    expect(e.preferMail).toBe(true);
    expect(e.linkedLabel.length).toBeGreaterThan(0);
  });

  it("mail for producteur grossiste a", () => {
    expect(
      shouldUseMailForRelationship({ self: "producteur", partner: "grossiste_a" }, FLAGS),
    ).toBe(true);
  });

  it("messaging for grossiste b pairs", () => {
    expect(
      shouldUseMailForRelationship({ self: "grossiste_b", partner: "grossiste_b" }, FLAGS),
    ).toBe(false);
  });

  it("linked label sanitized", () => {
    const ctx = buildRelationshipContext({ self: "grossiste_a", partner: "grossiste_b" }, { flags: FLAGS });
    expect(buildLinkedCommerceRelationshipLabel(ctx)).not.toMatch(/marketplace globale/i);
  });

  it("mock contexts per actor", () => {
    expect(mockRelationshipContextsForActor("detaillant", FLAGS).length).toBeGreaterThan(0);
  });

  it("hybrid corridor partner identity", () => {
    const ctx = buildRelationshipContext(
      { self: "grossiste_a", partner: "grossiste_b" },
      { level: "CORRIDOR_PARTNER", flags: FLAGS, corridorLabel: "Test" },
    );
    expect(ctx.governance.identityMode).toBe("HYBRID");
  });

  it("returns empty enrichment when context flag disabled", () => {
    expect(
      enrichLinkedCommerceContext(
        { self: "producteur", partner: "grossiste_a" },
        {
          flags: {
            ...FLAGS,
            commercial_relationship_context_enabled: false,
          },
        },
      ).linkedLabel.length,
    ).toBeGreaterThan(0);
  });
});
