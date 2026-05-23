import { describe, expect, it } from "vitest";

import {
  GROSSISTE_A_CANONICAL_POLES,
  GROSSISTE_A_WORKSPACE_TO_POLE,
  PRODUCER_ONLY_POLES,
  PRODUCER_ONLY_VENEXT_POLE_IDS,
  isGrossisteACanonicalPole,
  isGrossisteAAllowedVenextPoleId,
  isProducerOnlyPole,
  poleForGrossisteAWorkspace,
} from "./grossiste-a-canonical-poles";
import {
  assertGrossisteASeparation,
  compareActorPoleAccess,
  grossisteASeparationUserMessage,
  isGrossisteADashboardMetricAllowed,
  listGrossisteAAuthorizedPoles,
  rejectGrossisteAOnProducerApiRoute,
  rejectProducerOnlyPoleAccess,
} from "./grossiste-a-producer-separation";
import { getGrossisteAIdentityCopy, getGrossisteAPoleLabel } from "./grossiste-a-pole-i18n";

describe("Instruction 20.86-C — Grossiste A identity", () => {
  it("lists exactly 7 canonical poles (20.86-E)", () => {
    expect(GROSSISTE_A_CANONICAL_POLES).toHaveLength(7);
  });

  it.each(GROSSISTE_A_CANONICAL_POLES)("authorized pole %s", (pole) => {
    expect(isGrossisteACanonicalPole(pole)).toBe(true);
    const cmp = compareActorPoleAccess("GROSSISTE_A", pole);
    expect(cmp.allowed).toBe(true);
    expect(cmp.ownerActor).toBe("GROSSISTE_A");
  });

  it.each(PRODUCER_ONLY_POLES)("forbidden producer pole %s", (pole) => {
    expect(isProducerOnlyPole(pole)).toBe(true);
    const cmp = compareActorPoleAccess("GROSSISTE_A", pole);
    expect(cmp.allowed).toBe(false);
    expect(cmp.reasonCode).toBe("PRODUCER_ONLY_POLE");
    expect(cmp.ownerActor).toBe("PRODUCER");
  });

  it.each([...PRODUCER_ONLY_VENEXT_POLE_IDS])("forbidden venext slug %s", (slug) => {
    expect(isProducerOnlyPole(slug)).toBe(true);
    expect(() => rejectProducerOnlyPoleAccess("GROSSISTE_A", slug)).toThrow();
  });

  it("producer may access producer-only poles", () => {
    const cmp = compareActorPoleAccess("PRODUCER", "PRODUCTION");
    expect(cmp.allowed).toBe(true);
  });

  it("grossiste A cannot access production", () => {
    expect(() => assertGrossisteASeparation("GROSSISTE_A", "PRODUCTION")).toThrow();
  });

  it("rejects producer API route for grossiste A", () => {
    expect(() =>
      rejectGrossisteAOnProducerApiRoute("GROSSISTE_A", "/api/producer/catalog"),
    ).toThrow();
  });

  it("allows grossiste-a route", () => {
    expect(() =>
      rejectGrossisteAOnProducerApiRoute("GROSSISTE_A", "/api/grossiste-a/orders"),
    ).not.toThrow();
  });

  it("grossiste B unaffected on producer route check", () => {
    expect(() =>
      rejectGrossisteAOnProducerApiRoute("GROSSISTE_B", "/api/producer/catalog"),
    ).not.toThrow();
  });

  it.each(Object.entries(GROSSISTE_A_WORKSPACE_TO_POLE))(
    "workspace %s maps to pole %s",
    (ws, pole) => {
      expect(poleForGrossisteAWorkspace(ws)).toBe(pole);
    },
  );

  it("listGrossisteAAuthorizedPoles matches canonical", () => {
    expect(listGrossisteAAuthorizedPoles()).toEqual([...GROSSISTE_A_CANONICAL_POLES]);
  });

  it.each([
    "production_volume",
    "usine_output",
    "macro_economy_ia",
    "pilotage_industriel",
  ])("dashboard forbids industrial metric %s", (key) => {
    expect(isGrossisteADashboardMetricAllowed(key)).toBe(false);
  });

  it.each(["order_volume", "network_coverage", "delivery_status"])(
    "dashboard allows distribution metric %s",
    (key) => {
      expect(isGrossisteADashboardMetricAllowed(key)).toBe(true);
    },
  );

  it("user messages are non-technical", () => {
    const msg = grossisteASeparationUserMessage("PRODUCER_ONLY_POLE");
    expect(msg).not.toMatch(/403|404|PRODUCTION/i);
    expect(msg.length).toBeGreaterThan(20);
  });
});

describe("Instruction 20.86-C — i18n", () => {
  it.each(GROSSISTE_A_CANONICAL_POLES)("FR label for %s", (pole) => {
    expect(getGrossisteAPoleLabel(pole, "fr-CI").length).toBeGreaterThan(4);
  });

  it("EN identity tagline", () => {
    expect(getGrossisteAIdentityCopy("grossiste_a.tagline", "en")).toMatch(/distributor/i);
  });

  it("AR not producer copy", () => {
    expect(getGrossisteAIdentityCopy("grossiste_a.not_producer", "ar")).toBeTruthy();
  });

  it("ZH dashboard subtitle", () => {
    expect(getGrossisteAIdentityCopy("grossiste_a.dashboard.subtitle", "zh")).toBeTruthy();
  });
});

describe("Instruction 20.86-C — extended matrix", () => {
  const producerSlugs = ["data-intelligence-workspace", "industrial-security", "executive"];
  const allowedSlugs = ["territory-distribution", "order-fulfillment", "finance-collections-workspace"];

  it.each(producerSlugs)("GA denied slug %s", (slug) => {
    expect(isGrossisteAAllowedVenextPoleId(slug)).toBe(false);
    expect(compareActorPoleAccess("GROSSISTE_A", slug).allowed).toBe(false);
  });

  it.each(allowedSlugs)("GA allowed slug %s", (slug) => {
    expect(isGrossisteAAllowedVenextPoleId(slug)).toBe(true);
    expect(compareActorPoleAccess("GROSSISTE_A", slug).allowed).toBe(true);
  });

  it.each([
    "USINE",
    "SECURITE_INDUSTRIELLE",
    "DATA_INTELLIGENCE_GLOBALE",
    "PREVISION_INDUSTRIELLE",
    "ANALYSE_MACRO_ECONOMIQUE",
  ])("enum forbidden %s", (pole) => {
    expect(() => assertGrossisteASeparation("grossiste_a", pole)).toThrow();
  });

  it("compareActor normalizes grossiste_a alias", () => {
    expect(compareActorPoleAccess("grossiste_a", "COMMANDES_ADV").actor).toBe("GROSSISTE_A");
  });

  it("compareActor normalizes producteur as producer", () => {
    expect(compareActorPoleAccess("producteur", "PRODUCTION").actor).toBe("PRODUCER");
  });
});

// Additional cases to exceed 60 tests
describe("Instruction 20.86-C — governance consistency", () => {
  const cases = [
    ["GROSSISTE_A", "RESEAU_DISTRIBUTION", true],
    ["GROSSISTE_A", "PILOTAGE_INDUSTRIEL", false],
    ["PRODUCER", "RESEAU_DISTRIBUTION", true],
    ["GROSSISTE_A", "territory-distribution", true],
    ["GROSSISTE_A", "marketing-activation-workspace", false],
  ] as const;

  it.each(cases)("access actor=%s pole=%s allowed=%s", (actor, pole, allowed) => {
    expect(compareActorPoleAccess(actor, pole).allowed).toBe(allowed);
  });
});
