import { describe, expect, it } from "vitest";

import {
  assertNoSocialMarketplaceDrift,
  canExposeCatalogAcrossRelationship,
  isCommercialRelationshipGovernanceEnabled,
  isMultiLevelNetworkEnabled,
  resolveAutoAcceptMode,
  resolveRelationshipGovernance,
  resolveRelationshipIdentityMode,
} from "./commercial-relationship-governance";

const FLAGS = {
  commercial_relationship_governance_enabled: true,
  commercial_multi_level_network_enabled: true,
  commercial_relationship_context_enabled: true,
};

describe("commercial relationship governance (20.75)", () => {
  it("enabled by default in dev flags", () => {
    expect(isCommercialRelationshipGovernanceEnabled({})).toBe(true);
    expect(isMultiLevelNetworkEnabled(FLAGS)).toBe(true);
  });

  it("Producteur ↔ Grossiste A formal mail manual", () => {
    const g = resolveRelationshipGovernance(
      { self: "producteur", partner: "grossiste_a" },
      { level: "FORMAL_DISTRIBUTOR", flags: FLAGS },
    );
    expect(g.communicationMode).toBe("professional-mail");
    expect(g.identityMode).toBe("FORMAL");
    expect(g.autoAccept).toBe("manual");
    expect(g.formalUi).toBe(true);
  });

  it("Grossiste B ↔ Détaillant terrain messaging auto", () => {
    const g = resolveRelationshipGovernance(
      { self: "grossiste_b", partner: "detaillant" },
      { flags: FLAGS },
    );
    expect(g.communicationMode).toBe("messaging-terrain");
    expect(g.identityMode).toBe("CONTACT_FIRST");
    expect(g.autoAccept).toBe("auto");
    expect(g.terrainUi).toBe(true);
  });

  it("Grossiste A ↔ Grossiste B hybrid", () => {
    const g = resolveRelationshipGovernance(
      { self: "grossiste_a", partner: "grossiste_b" },
      { flags: FLAGS },
    );
    expect(g.communicationMode).toBe("formal-terrain-mix");
    expect(resolveRelationshipIdentityMode(g.relationshipType)).toBe("HYBRID");
  });

  it("Détaillant ↔ Détaillant ultra light", () => {
    const g = resolveRelationshipGovernance(
      { self: "detaillant", partner: "detaillant" },
      { flags: FLAGS },
    );
    expect(g.communicationMode).toBe("messaging-ultra-light");
  });

  it("corridor sponsorship on corridor level", () => {
    const g = resolveRelationshipGovernance(
      { self: "grossiste_a", partner: "grossiste_b" },
      { level: "CORRIDOR_PARTNER", flags: FLAGS, corridorActive: true },
    );
    expect(g.sponsorshipEnabled).toBe(true);
    expect(g.catalogMode).toBe("sponsored-discovery");
  });

  it("linked commerce enabled with context flag", () => {
    const g = resolveRelationshipGovernance(
      { self: "producteur", partner: "grossiste_b" },
      { flags: FLAGS },
    );
    expect(g.linkedCommerceEnabled).toBe(true);
  });

  it("auto accept contextual for temporary supplier", () => {
    expect(
      resolveAutoAcceptMode("GROSSISTE_B_GROSSISTE_B", "TEMPORARY_SUPPLIER"),
    ).toBe("auto");
    expect(resolveAutoAcceptMode("PRODUCTEUR_GROSSISTE_A")).toBe("manual");
  });

  it("catalog exposure allowed for grossiste redistribution", () => {
    expect(
      canExposeCatalogAcrossRelationship({ self: "grossiste_a", partner: "grossiste_b" }, FLAGS),
    ).toBe(true);
  });

  it("conditional producteur detaillant needs multi-level flag", () => {
    expect(
      canExposeCatalogAcrossRelationship(
        { self: "producteur", partner: "detaillant" },
        { ...FLAGS, commercial_multi_level_network_enabled: false },
      ),
    ).toBe(false);
    expect(
      canExposeCatalogAcrossRelationship({ self: "producteur", partner: "detaillant" }, FLAGS),
    ).toBe(true);
  });

  it("anti social marketplace ui", () => {
    expect(assertNoSocialMarketplaceDrift("partner-card")).toBe(true);
    expect(assertNoSocialMarketplaceDrift("social-feed")).toBe(false);
    expect(assertNoSocialMarketplaceDrift("public-marketplace")).toBe(false);
  });

  it("anti ERP — governance not supply chain", () => {
    const g = resolveRelationshipGovernance(
      { self: "grossiste_b", partner: "grossiste_b" },
      { flags: FLAGS },
    );
    expect(g.orderMode).not.toBe("erp" as never);
    expect(JSON.stringify(g)).not.toMatch(/supply chain enterprise/i);
  });

  it("disabled when flag off", () => {
    expect(
      isCommercialRelationshipGovernanceEnabled({
        commercial_relationship_governance_enabled: false,
      }),
    ).toBe(false);
  });

  it("Producteur ↔ Grossiste B mail light hybrid", () => {
    const g = resolveRelationshipGovernance(
      { self: "producteur", partner: "grossiste_b" },
      { flags: FLAGS },
    );
    expect(g.communicationMode).toBe("mail-light-hybrid");
    expect(g.identityMode).toBe("HYBRID");
  });

  it("Grossiste A ↔ Grossiste A mail commerce mix", () => {
    const g = resolveRelationshipGovernance(
      { self: "grossiste_a", partner: "grossiste_a" },
      { flags: FLAGS },
    );
    expect(g.communicationMode).toBe("mail-commerce-mix");
    expect(resolveRelationshipIdentityMode("GROSSISTE_A_GROSSISTE_A")).toBe("FORMAL");
  });

  it("Grossiste B ↔ Grossiste B commerce messaging", () => {
    const g = resolveRelationshipGovernance(
      { self: "grossiste_b", partner: "grossiste_b" },
      { flags: FLAGS },
    );
    expect(g.communicationMode).toBe("commerce-messaging");
    expect(g.autoAccept).toBe("auto");
  });

  it("partner visibility stays partner-scoped not public", () => {
    const g = resolveRelationshipGovernance(
      { self: "detaillant", partner: "detaillant" },
      { flags: FLAGS },
    );
    expect(g.partnerVisibility).not.toBe("public" as never);
    expect(g.partnerVisibility).toBe("partner");
  });
});
