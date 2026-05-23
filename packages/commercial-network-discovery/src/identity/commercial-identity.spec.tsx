import { describe, expect, it } from "vitest";

import { render, screen } from "@testing-library/react";

import { CommercialRelationshipCard } from "../CommercialRelationshipCard";
import { applyTerrainIdentityToSuggestion } from "./applyTerrainDisplayIdentity";
import {
  isActivityBasedSuggestionsEnabled,
  isContactFirstIdentityEnabled,
  isTerrainPseudoIdentityEnabled,
  isTerrainQuickOnboardingEnabled,
  resolveTerrainIdentityModeForRole,
  shouldUseContactFirstDisplay,
  shouldUseFormalDisplay,
} from "./commercial-identity-governance";
import {
  buildContactDiscoveryHints,
  buildContactFirstIdentitySignals,
  buildIdentityRecognitionHints,
  buildPseudoIdentityHints,
  buildTerrainRegistrationHints,
  buildTerrainRelationshipHints,
  recognitionReasonToBadge,
  sanitizeCommercialIdentityText,
} from "./commercial-identity-intelligence";
import {
  mockScenarioActivityDiscovery,
  mockScenarioClientYopougonGrossisteView,
  mockScenarioFormalProducer,
  mockScenarioFrançoisRetailerView,
} from "./commercial-identity-mock-data";
import { maskPhoneNumber, resolveTerrainDisplayIdentity } from "./resolveTerrainDisplayIdentity";
import { resolveFormalDisplayIdentity } from "./resolveFormalDisplayIdentity";

describe("resolveTerrainDisplayIdentity", () => {
  it("prioritises contactName over businessName", () => {
    const id = resolveTerrainDisplayIdentity({
      actorId: "a1",
      actorType: "DETAILLANT",
      phoneNumber: "+2250701020304",
      contactName: "François",
      registeredBusinessName: "La Rue de la Mode",
      activityLabel: "Chaussures",
      city: "Adjamé",
      matchKind: "mutual",
    });
    expect(id.displayName).toBe("François");
    expect(id.secondaryName).toContain("La Rue de la Mode");
    expect(id.secondaryName).toContain("Chaussures");
  });

  it("shows Sarah grossiste with secondary distribution line", () => {
    const id = resolveTerrainDisplayIdentity({
      actorId: "a2",
      actorType: "GROSSISTE_B",
      phoneNumber: "+2250505060708",
      contactName: "Sarah grossiste",
      registeredBusinessName: "Sarah Distribution",
      activityLabel: "Boissons",
    });
    expect(id.displayName).toBe("Sarah grossiste");
    expect(id.secondaryName).toContain("Sarah Distribution");
  });

  it("uses registeredPersonalName when contact absent", () => {
    const id = resolveTerrainDisplayIdentity({
      actorId: "a3",
      actorType: "DETAILLANT",
      phoneNumber: "+2250102030405",
      registeredPersonalName: "Moussa Traoré",
      registeredBusinessName: "Maison du Sucre",
    });
    expect(id.displayName).toBe("Moussa Traoré");
    expect(id.secondaryName).toContain("Maison du Sucre");
  });

  it("uses businessName when no contact or personal name", () => {
    const id = resolveTerrainDisplayIdentity({
      actorId: "a4",
      actorType: "DETAILLANT",
      phoneNumber: "+2250708091011",
      registeredBusinessName: "Boutique Le Progrès",
    });
    expect(id.displayName).toBe("Boutique Le Progrès");
  });

  it("masks phone when no names available", () => {
    const id = resolveTerrainDisplayIdentity({
      actorId: "a5",
      actorType: "GROSSISTE_B",
      phoneNumber: "+2250700000000",
    });
    expect(id.displayName).toMatch(/\*\*/);
    expect(id.secondaryName).toBe("Contact commercial potentiel");
    expect(id.displayMode).toBe("UNKNOWN_CONTACT_IDENTITY");
  });

  it("never uses business as primary when contactName exists", () => {
    const id = mockScenarioFrançoisRetailerView();
    expect(id.displayName).toBe("François");
    expect(id.displayName).not.toBe("La Rue de la Mode");
  });

  it("supports grossiste Client Yopougon scenario", () => {
    const id = mockScenarioClientYopougonGrossisteView();
    expect(id.displayName).toBe("Client Yopougon");
    expect(id.secondaryName).toContain("Boutique Espoir");
  });

  it("marks activity discovery as MIXED_DISCOVERY_IDENTITY", () => {
    const id = mockScenarioActivityDiscovery();
    expect(id.displayMode).toBe("MIXED_DISCOVERY_IDENTITY");
    expect(id.secondaryName).toContain("Suggestion selon activité");
  });

  it("shows human name not boutique alone for activity discovery", () => {
    const id = mockScenarioActivityDiscovery();
    expect(id.displayName).toBe("Aminata");
    expect(id.displayName).not.toBe("Maison du Sucre CI");
    expect(id.secondaryName).toContain("Maison du Sucre CI");
  });

  it("prioritises registeredDisplayName over business for unknown contacts", () => {
    const id = resolveTerrainDisplayIdentity({
      actorId: "disc-1",
      actorType: "GROSSISTE_B",
      phoneNumber: "+2250304050607",
      registeredDisplayName: "Moussa",
      registeredBusinessName: "Maison du Sucre",
      activityLabel: "Alimentation",
      city: "Yopougon",
      activityDiscovery: true,
      matchKind: "activity_boosted",
    });
    expect(id.displayName).toBe("Moussa");
    expect(id.secondaryName).toContain("Maison du Sucre");
  });

  it("contact-first shows phone contact over registered pseudo", () => {
    const id = resolveTerrainDisplayIdentity({
      actorId: "cf-1",
      actorType: "GROSSISTE_B",
      phoneNumber: "+2250701020304",
      contactName: "Moussa sucre",
      registeredDisplayName: "Moussa",
      registeredBusinessName: "Maison du Sucre",
      activityLabel: "Alimentation",
      city: "Yopougon",
      matchKind: "mutual",
    });
    expect(id.displayName).toBe("Moussa sucre");
  });

  it("sets mutual recognition reason", () => {
    const id = resolveTerrainDisplayIdentity({
      actorId: "m1",
      actorType: "DETAILLANT",
      phoneNumber: "+2250701020304",
      contactName: "François",
      matchKind: "mutual",
    });
    expect(id.recognitionReason).toBe("CONTACT_MUTUAL_MATCH");
  });

  it("keeps local contact name private flag", () => {
    const id = resolveTerrainDisplayIdentity({
      actorId: "p1",
      actorType: "GROSSISTE_B",
      phoneNumber: "+2250701020304",
      contactName: "François chaussures pas cher",
    });
    expect(id.isLocalContactNamePrivate).toBe(true);
  });
});

describe("resolveFormalDisplayIdentity", () => {
  it("prioritises registeredBusinessName for producer", () => {
    const id = resolveFormalDisplayIdentity({
      actorId: "prod-1",
      actorType: "PRODUCER",
      registeredBusinessName: "AgroNexus CI",
      city: "San Pedro",
      activityLabel: "Agro-industrie",
    });
    expect(id.displayName).toBe("AgroNexus CI");
    expect(id.displayMode).toBe("FORMAL_IDENTITY");
    expect(id.recognitionReason).toBe("FORMAL_VALIDATED_PARTNER");
  });

  it("uses legalName when business missing", () => {
    const id = resolveFormalDisplayIdentity({
      actorId: "ga-1",
      actorType: "GROSSISTE_A",
      legalName: "Ivoire Agro Distribution",
      city: "Abidjan",
    });
    expect(id.displayName).toBe("Ivoire Agro Distribution");
    expect(id.secondaryName).toContain("Grossiste A");
  });

  it("formal producer mock uses structure name", () => {
    const id = mockScenarioFormalProducer();
    expect(id.displayName).toBe("AgroNexus CI");
    expect(id.secondaryName).toContain("San Pedro");
  });
});

describe("commercial identity governance", () => {
  it("enables contact-first for terrain roles by default in dev flags", () => {
    expect(shouldUseContactFirstDisplay("grossiste_b", {})).toBe(true);
    expect(shouldUseContactFirstDisplay("detaillant", {})).toBe(true);
    expect(
      shouldUseContactFirstDisplay("grossiste_b", {
        commercial_contact_first_identity_enabled: false,
      }),
    ).toBe(false);
  });

  it("requires formal display for producer and grossiste A", () => {
    expect(shouldUseFormalDisplay("producteur")).toBe(true);
    expect(shouldUseFormalDisplay("grossiste_a")).toBe(true);
    expect(shouldUseFormalDisplay("grossiste_b")).toBe(false);
  });

  it("reads activity suggestion flag", () => {
    expect(isActivityBasedSuggestionsEnabled({})).toBe(true);
    expect(
      isActivityBasedSuggestionsEnabled({ commercial_activity_based_suggestions_enabled: false }),
    ).toBe(false);
  });

  it("reads contact-first flag", () => {
    expect(isContactFirstIdentityEnabled({})).toBe(true);
    expect(isContactFirstIdentityEnabled({ commercial_contact_first_identity_enabled: false })).toBe(
      false,
    );
  });

  it("terrain roles use CONTACT_FIRST mode", () => {
    expect(resolveTerrainIdentityModeForRole("grossiste_b")).toBe("CONTACT_FIRST");
    expect(resolveTerrainIdentityModeForRole("detaillant")).toBe("CONTACT_FIRST");
    expect(resolveTerrainIdentityModeForRole("producteur")).toBe("FORMAL_ONLY");
  });

  it("reads terrain quick onboarding flag", () => {
    expect(isTerrainQuickOnboardingEnabled({})).toBe(true);
    expect(isTerrainQuickOnboardingEnabled({ terrain_quick_onboarding_enabled: false })).toBe(false);
  });

  it("reads terrain pseudo identity flag", () => {
    expect(isTerrainPseudoIdentityEnabled({})).toBe(true);
    expect(isTerrainPseudoIdentityEnabled({ terrain_pseudo_identity_enabled: false })).toBe(false);
  });
});

describe("commercial identity intelligence", () => {
  it("builds mutual contact hints", () => {
    const hints = buildIdentityRecognitionHints({
      recognitionReason: "CONTACT_MUTUAL_MATCH",
      displayMode: "CONTACT_FIRST_IDENTITY",
    });
    expect(hints).toContain("Contact mutuel");
  });

  it("builds activity suggestion badge text", () => {
    expect(
      recognitionReasonToBadge("ACTIVITY_MATCH", "MIXED_DISCOVERY_IDENTITY"),
    ).toBe("Suggestion selon activité");
  });

  it("sanitises forbidden scoring jargon", () => {
    expect(sanitizeCommercialIdentityText("Compatibilité commerciale 98%")).not.toMatch(/98%/i);
    expect(sanitizeCommercialIdentityText("Match algorithmique")).not.toMatch(/algorithmique/i);
  });

  it("builds contact sync hints without exposing raw contacts", () => {
    const hints = buildContactDiscoveryHints({ contactSyncGranted: true, localContactsCount: 42 });
    expect(hints[0]).toContain("42");
    expect(hints[0]).not.toContain("@");
  });

  it("builds terrain relationship hints", () => {
    const hints = buildTerrainRelationshipHints({ autoAccept: true, mutualContact: true });
    expect(hints.some((h) => h.includes("téléphone"))).toBe(true);
  });

  it("builds pseudo identity hints without corporate jargon", () => {
    const hints = buildPseudoIdentityHints("Moussa");
    expect(hints[0]).toContain("Partenaire terrain");
    expect(sanitizeCommercialIdentityText(hints.join(" "))).not.toMatch(/entreprise certifiée/i);
  });

  it("builds contact-first signals", () => {
    expect(buildContactFirstIdentitySignals(true)).toContain("Contact reconnu");
    expect(buildContactFirstIdentitySignals(false)).toHaveLength(0);
  });

  it("builds terrain registration hints", () => {
    const hints = buildTerrainRegistrationHints();
    expect(hints.some((h) => h.includes("secondes"))).toBe(true);
    expect(hints.join(" ")).not.toMatch(/kyc|raison sociale/i);
  });
});

describe("applyTerrainIdentityToSuggestion", () => {
  it("preserves local display after auto-accept enrichment", () => {
    const enriched = applyTerrainIdentityToSuggestion(
      {
        id: "x1",
        phone: "+2250701020304",
        displayName: "La Rue de la Mode",
        localContactName: "François",
        registeredBusinessName: "La Rue de la Mode",
        city: "Adjamé",
        activityLabel: "Chaussures",
        photoInitials: "LR",
        matchKind: "mutual",
        partnerStatus: "connected",
        catalogPreviewCount: 1,
      },
      "detaillant",
      { commercial_contact_first_identity_enabled: true },
    );
    expect(enriched.displayName).toBe("François");
    expect(enriched.recognitionHint).toBe("Contact mutuel");
  });

  it("does not leak local contact label in exported identity fields", () => {
    const enriched = applyTerrainIdentityToSuggestion(
      {
        id: "x2",
        phone: "+2250701020304",
        displayName: "Hidden",
        localContactName: "François chaussures pas cher",
        registeredBusinessName: "Shop",
        city: "Abidjan",
        activityLabel: "Mode",
        photoInitials: "FC",
        matchKind: "mutual",
        partnerStatus: "suggested",
        catalogPreviewCount: 0,
      },
      "grossiste_b",
      { commercial_contact_first_identity_enabled: true },
    );
    expect(enriched.displayName).toBe("François chaussures pas cher");
    expect(JSON.stringify(enriched)).not.toContain("remote");
  });
});

describe("CommercialRelationshipCard UI", () => {
  it("renders contact-first displayName prominently", () => {
    render(
      <CommercialRelationshipCard
        suggestion={{
          id: "ui-1",
          phone: "+2250701020304",
          displayName: "François",
          secondaryName: "La Rue de la Mode · Chaussures · Adjamé",
          city: "Adjamé",
          activityLabel: "Chaussures",
          photoInitials: "FR",
          matchKind: "mutual",
          partnerStatus: "suggested",
          catalogPreviewCount: 3,
          recognitionHint: "Contact mutuel",
        }}
        onConnect={() => {}}
        autoAccept
      />,
    );
    expect(screen.getByTestId("cnd-display-name-ui-1").textContent).toBe("François");
    expect(screen.getByTestId("cnd-secondary-name-ui-1").textContent).toContain("La Rue de la Mode");
    expect(screen.getByTestId("cnd-recognition-hint-ui-1").textContent).toBe("Contact mutuel");
  });

  it("shows activity suggestion badge without score", () => {
    render(
      <CommercialRelationshipCard
        suggestion={{
          id: "ui-2",
          phone: "+2250203040506",
          displayName: "Aminata boissons",
          secondaryName: "Suggestion selon activité · Boissons · Abidjan",
          city: "Abidjan",
          activityLabel: "Boissons",
          photoInitials: "AB",
          matchKind: "activity_boosted",
          partnerStatus: "suggested",
          catalogPreviewCount: 2,
          recognitionHint: "Suggestion selon activité",
        }}
        onConnect={() => {}}
        autoAccept={false}
      />,
    );
    expect(screen.getByText("Suggestion selon activité")).toBeTruthy();
    expect(screen.queryByText(/98%/)).toBeNull();
  });
});

describe("maskPhoneNumber", () => {
  it("masks middle digits for ivory coast numbers", () => {
    expect(maskPhoneNumber("+2250700000000")).toBe("+225 07 ** ** 00");
  });
});

describe("formal vs terrain separation", () => {
  it("formal identity ignores contactName input path", () => {
    const formal = resolveFormalDisplayIdentity({
      actorId: "f1",
      actorType: "GROSSISTE_A",
      registeredBusinessName: "Distribution Nord Plus",
      registeredPersonalName: "Ne doit pas primer",
    });
    expect(formal.displayName).toBe("Distribution Nord Plus");
  });
});
