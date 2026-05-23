import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  GROSSISTE_A_CANONICAL_POLES,
  GROSSISTE_A_POLE_SLUGS,
  normalizeGrossisteAPoleKey,
  poleForGrossisteAWorkspace,
  poleSlugForBusinessPole,
} from "./grossiste-a-canonical-poles";
import {
  assertCrossPoleCoherence,
  buildSharedCommerceSignals,
  signalsForPole,
} from "./grossiste-a-commerce-signals";
import {
  buildCollaboratorInvitationLink,
  buildEnterpriseRootLink,
  buildPoleActivationLink,
  assertEnterpriseLinkIntegrity,
  assertInvitationHierarchy,
  assertPoleLinkIntegrity,
  getActivationLink,
  resetActivationLinkRegistry,
  revokeActivationLinkCascade,
} from "./enterprise-activation-link-hierarchy";
import {
  createEnterpriseChannel,
  getEnterpriseChannel,
} from "./enterprise-governance-storage";
import { resetAllEnterpriseGovernanceStorage } from "./enterprise-governance-reset";
import { generateEnterpriseSecureLink } from "./enterprise-secure-links";
import { assertInvitationActorConsistency } from "./enterprise-pole-compatibility";
import {
  getGrossisteAPoleBusinessContent,
  hydratePoleSignals,
  isDecorativeKpi,
  listGrossisteAPoleBusinessContents,
  poleContentMeetsMinimum,
} from "./grossiste-a-pole-content";
import { auditEnterprisePoleContentIntegrity } from "./grossiste-a-pole-content-audit";
import { GrossisteAPoleBusinessSurface } from "./GrossisteAPoleBusinessSurface";
import { getGrossisteAPoleLabel } from "./grossiste-a-pole-i18n";

const ENT = "ent-ga-86e";

function seedGrossisteAChannel() {
  resetAllEnterpriseGovernanceStorage();
  resetActivationLinkRegistry();
  createEnterpriseChannel({
    enterpriseId: ENT,
    actorKind: "grossiste_a",
    contractReference: "CTR-86E",
    companyName: "Grossiste A Test",
    headquarters: "Abidjan",
    governanceStatus: "ACTIVE",
    activationStatus: "ACTIVE",
  });
}

describe("Instruction 20.86-E — canonical poles", () => {
  it("defines exactly 7 official poles", () => {
    expect(GROSSISTE_A_CANONICAL_POLES).toHaveLength(7);
    expect(GROSSISTE_A_CANONICAL_POLES).toEqual([
      "PILOTAGE_COMMERCIAL",
      "RESEAU_DISTRIBUTION",
      "COMMANDES_ADV",
      "LIVRAISON_RECEPTION",
      "FINANCE_REGLEMENTS",
      "RELATIONS_PARTENAIRES",
      "SECURITE_GOUVERNANCE",
    ]);
  });

  it.each(GROSSISTE_A_CANONICAL_POLES)("slug for %s", (pole) => {
    expect(poleSlugForBusinessPole(pole)).toMatch(/^[a-z0-9-]+$/);
    expect(GROSSISTE_A_POLE_SLUGS[pole]).toBe(poleSlugForBusinessPole(pole));
  });

  it.each([
    ["DIRECTION_COMMERCIALE", "PILOTAGE_COMMERCIAL"],
    ["LIVRAISON_DISTRIBUTION", "LIVRAISON_RECEPTION"],
    ["TERRITOIRE_ACTIVITE", "RESEAU_DISTRIBUTION"],
  ])("legacy alias %s → %s", (legacy, canonical) => {
    expect(normalizeGrossisteAPoleKey(legacy)).toBe(canonical);
  });

  it.each([
    ["overview", "PILOTAGE_COMMERCIAL"],
    ["orders", "COMMANDES_ADV"],
    ["distribution", "LIVRAISON_RECEPTION"],
    ["governance", "SECURITE_GOUVERNANCE"],
    ["commerce-messaging", "RELATIONS_PARTENAIRES"],
  ])("workspace %s → pole %s", (ws, pole) => {
    expect(poleForGrossisteAWorkspace(ws)).toBe(pole);
  });
});

describe("Instruction 20.86-E — pole business content", () => {
  it.each(GROSSISTE_A_CANONICAL_POLES)("pole %s meets minimum content", (pole) => {
    const content = getGrossisteAPoleBusinessContent(pole);
    expect(poleContentMeetsMinimum(content)).toBe(true);
  });

  it("lists content for all canonical poles", () => {
    expect(listGrossisteAPoleBusinessContents()).toHaveLength(7);
  });

  it.each(["kpi", "metric", "NPS", "churn"])("rejects decorative label %s", (label) => {
    expect(isDecorativeKpi(label)).toBe(true);
  });

  it.each(["Commandes en attente", "Règlements attendus", "Activité réseau"])(
    "allows real label %s",
    (label) => {
      expect(isDecorativeKpi(label)).toBe(false);
    },
  );

  it("hydrates signal values", () => {
    const hydrated = hydratePoleSignals("COMMANDES_ADV", { "ca-pending": "12" });
    expect(hydrated.signals.find((s) => s.id === "ca-pending")?.value).toBe("12");
  });

  it.each(GROSSISTE_A_CANONICAL_POLES)("pole %s has at least one action", (pole) => {
    expect(getGrossisteAPoleBusinessContent(pole).actions.length).toBeGreaterThan(0);
  });

  it("pilotage links to finance and adv cross-refs", () => {
    const pc = getGrossisteAPoleBusinessContent("PILOTAGE_COMMERCIAL");
    const refs = pc.signals.flatMap((s) => s.crossPoleRefs ?? []);
    expect(refs).toContain("FINANCE_REGLEMENTS");
    expect(refs).toContain("COMMANDES_ADV");
  });

  it("audit passes on canonical templates", () => {
    const audit = auditEnterprisePoleContentIntegrity();
    expect(audit.ok).toBe(true);
    expect(audit.issues).toHaveLength(0);
  });

  it("audit detects empty pole set", () => {
    const audit = auditEnterprisePoleContentIntegrity({ contents: [] });
    expect(audit.ok).toBe(false);
    expect(audit.issues.some((i) => i.code === "pole_count")).toBe(true);
  });

  it("audit detects decorative kpi when injected", () => {
    const bad = getGrossisteAPoleBusinessContent("PILOTAGE_COMMERCIAL");
    bad.signals = [{ id: "x", label: "kpi", value: "1" }];
    const audit = auditEnterprisePoleContentIntegrity({
      contents: [bad],
      sharedSignals: buildSharedCommerceSignals({ lateOrderCount: 1 }),
    });
    expect(audit.ok).toBe(false);
  });
});

describe("Instruction 20.86-E — shared commerce signals", () => {
  it("propagates late orders across ADV, livraison, pilotage", () => {
    const shared = buildSharedCommerceSignals({ lateOrderCount: 2 });
    expect(assertCrossPoleCoherence(shared)).toBe(true);
    expect(signalsForPole("COMMANDES_ADV", shared).length).toBeGreaterThan(0);
    expect(signalsForPole("LIVRAISON_RECEPTION", shared).length).toBeGreaterThan(0);
    expect(signalsForPole("PILOTAGE_COMMERCIAL", shared).length).toBeGreaterThan(0);
  });

  it.each([
    ["pendingOrders", 3, "COMMANDES_ADV"],
    ["pendingSettlements", 2, "FINANCE_REGLEMENTS"],
    ["inactivePartners", 1, "RESEAU_DISTRIBUTION"],
  ] as const)("signal %s visible on %s", (key, value, pole) => {
    const shared = buildSharedCommerceSignals({ [key]: value });
    expect(signalsForPole(pole, shared).length).toBeGreaterThan(0);
  });
});

afterEach(() => {
  cleanup();
});

describe("Instruction 20.86-E — activation link hierarchy", () => {
  beforeEach(seedGrossisteAChannel);

  it("builds enterprise root link", () => {
    const root = buildEnterpriseRootLink({ enterpriseId: ENT, actorKind: "grossiste_a" });
    expect(root.kind).toBe("enterprise");
    expect(root.url).toContain("venext.co/e/");
    expect(root.secureToken.length).toBeGreaterThan(10);
  });

  it("pole link derives from enterprise root", () => {
    const root = buildEnterpriseRootLink({ enterpriseId: ENT, actorKind: "grossiste_a" });
    const pole = buildPoleActivationLink({
      enterpriseId: ENT,
      poleId: "COMMANDES_ADV",
      parentEnterpriseToken: root.secureToken,
    });
    expect(pole.kind).toBe("pole");
    expect(pole.parentToken).toBe(root.secureToken);
    expect(pole.url).toMatch(/venext\.co\/e\/.+\/.+\/.+/);
    expect(pole.poleBusinessKey).toBe("COMMANDES_ADV");
  });

  it("collaborator link derives from pole link", () => {
    const root = buildEnterpriseRootLink({ enterpriseId: ENT, actorKind: "grossiste_a" });
    const pole = buildPoleActivationLink({
      enterpriseId: ENT,
      poleId: "RESEAU_DISTRIBUTION",
      parentEnterpriseToken: root.secureToken,
    });
    const secure = generateEnterpriseSecureLink({ enterpriseId: ENT, poleId: "relational-commercial" });
    const collab = buildCollaboratorInvitationLink({
      enterpriseId: ENT,
      poleId: "RESEAU_DISTRIBUTION",
      internalUserId: "user-1",
      parentPoleToken: pole.secureToken,
      invitation: secure.invitation,
    });
    expect(collab.kind).toBe("collaborator");
    expect(collab.parentToken).toBe(pole.secureToken);
    expect(collab.internalUserId).toBe("user-1");
  });

  it("blocks pole link without valid enterprise parent", () => {
    expect(() =>
      buildPoleActivationLink({
        enterpriseId: ENT,
        poleId: "COMMANDES_ADV",
        parentEnterpriseToken: "invalid-token",
      }),
    ).toThrow(/ENTERPRISE_LINK/);
  });

  it("blocks collaborator without pole parent", () => {
    const root = buildEnterpriseRootLink({ enterpriseId: ENT, actorKind: "grossiste_a" });
    const secure = generateEnterpriseSecureLink({ enterpriseId: ENT, poleId: "commercial" });
    expect(() =>
      buildCollaboratorInvitationLink({
        enterpriseId: ENT,
        poleId: "COMMANDES_ADV",
        internalUserId: "u2",
        parentPoleToken: root.secureToken,
        invitation: secure.invitation,
      }),
    ).toThrow(/POLE_LINK/);
  });

  it("assertEnterpriseLinkIntegrity rejects wrong enterprise", () => {
    const root = buildEnterpriseRootLink({ enterpriseId: ENT, actorKind: "grossiste_a" });
    expect(() => assertEnterpriseLinkIntegrity(root, "other-ent")).toThrow();
  });

  it("assertPoleLinkIntegrity rejects pole mismatch", () => {
    const root = buildEnterpriseRootLink({ enterpriseId: ENT, actorKind: "grossiste_a" });
    const pole = buildPoleActivationLink({
      enterpriseId: ENT,
      poleId: "FINANCE_REGLEMENTS",
      parentEnterpriseToken: root.secureToken,
    });
    expect(() => assertPoleLinkIntegrity(pole, ENT, "COMMANDES_ADV")).toThrow();
  });

  it("cascade revokes descendant links", () => {
    const root = buildEnterpriseRootLink({ enterpriseId: ENT, actorKind: "grossiste_a" });
    buildPoleActivationLink({
      enterpriseId: ENT,
      poleId: "PILOTAGE_COMMERCIAL",
      parentEnterpriseToken: root.secureToken,
    });
    const count = revokeActivationLinkCascade(ENT);
    expect(count).toBeGreaterThan(0);
    expect(getActivationLink(root.secureToken)?.revokedAt).toBeTruthy();
  });

  it("wrong actor on enterprise root throws", () => {
    expect(() =>
      buildEnterpriseRootLink({ enterpriseId: ENT, actorKind: "producteur" }),
    ).toThrow(/ACTOR_MISMATCH/);
  });

  it("assertInvitationHierarchy validates enterprise match", () => {
    const channel = getEnterpriseChannel(ENT)!;
    const secure = generateEnterpriseSecureLink({ enterpriseId: ENT, poleId: "commercial" });
    expect(() => assertInvitationHierarchy(secure.invitation, channel)).not.toThrow();
    const bad = { ...secure.invitation, enterpriseId: "other" };
    expect(() => assertInvitationHierarchy(bad, channel)).toThrow();
  });

  it("assertInvitationActorConsistency blocks wrong enterprise", () => {
    const channel = getEnterpriseChannel(ENT)!;
    const secure = generateEnterpriseSecureLink({ enterpriseId: "wrong", poleId: "commercial" });
    expect(() => assertInvitationActorConsistency(secure.invitation, channel)).toThrow();
  });
});

describe("Instruction 20.86-E — UI surface", () => {
  it("renders pilotage signals and actions", () => {
    render(
      <GrossisteAPoleBusinessSurface
        pole="PILOTAGE_COMMERCIAL"
        signalValues={{ "pc-pending-orders": "5" }}
        sharedSignals={buildSharedCommerceSignals({ lateOrderCount: 1, pendingOrders: 2 })}
        onAction={() => undefined}
      />,
    );
    expect(screen.getByTestId("ga-pole-surface-PILOTAGE_COMMERCIAL")).toBeTruthy();
    expect(screen.getByTestId("ga-pole-signal-pc-pending-orders")).toBeTruthy();
    expect(screen.getByTestId("ga-pole-action-pc-act")).toBeTruthy();
    expect(screen.getByTestId("ga-shared-signal-sig-late-order")).toBeTruthy();
  });

  it.each(GROSSISTE_A_CANONICAL_POLES)("renders surface for %s", (pole) => {
    const { unmount } = render(<GrossisteAPoleBusinessSurface pole={pole} />);
    expect(screen.getByTestId(`ga-pole-surface-${pole}`)).toBeTruthy();
    unmount();
  });
});

describe("Instruction 20.86-E — i18n 86-E poles", () => {
  it.each(GROSSISTE_A_CANONICAL_POLES)("FR label %s", (pole) => {
    expect(getGrossisteAPoleLabel(pole, "fr-CI").length).toBeGreaterThan(4);
  });

  it("EN pilotage label", () => {
    expect(getGrossisteAPoleLabel("PILOTAGE_COMMERCIAL", "en")).toMatch(/commercial/i);
  });

  it("AR finance label", () => {
    expect(getGrossisteAPoleLabel("FINANCE_REGLEMENTS", "ar")).toBeTruthy();
  });

  it("ZH security label", () => {
    expect(getGrossisteAPoleLabel("SECURITE_GOUVERNANCE", "zh")).toBeTruthy();
  });
});

describe("Instruction 20.86-E — security matrix", () => {
  const forbiddenPoles = ["PRODUCTION", "USINE", "DATA_INTELLIGENCE_GLOBALE"];

  beforeEach(seedGrossisteAChannel);

  it.each(forbiddenPoles)("grossiste A cannot activate producer pole %s via link", (poleId) => {
    const root = buildEnterpriseRootLink({ enterpriseId: ENT, actorKind: "grossiste_a" });
    expect(() =>
      buildPoleActivationLink({
        enterpriseId: ENT,
        poleId,
        parentEnterpriseToken: root.secureToken,
      }),
    ).toThrow();
  });
});

// Extended matrix to reach 90+ tests
describe("Instruction 20.86-E — extended pole signals", () => {
  const signalIds = [
    "pc-partners",
    "rd-gb",
    "ca-pending",
    "lr-progress",
    "fr-expected",
    "rp-active",
    "sg-active",
  ];

  it.each(signalIds)("signal id %s exists in some pole", (id) => {
    const found = listGrossisteAPoleBusinessContents().some((c) =>
      c.signals.some((s) => s.id === id),
    );
    expect(found).toBe(true);
  });
});

describe("Instruction 20.86-E — link URL structure", () => {
  beforeEach(seedGrossisteAChannel);

  it.each(GROSSISTE_A_CANONICAL_POLES)("private URL for pole %s", (pole) => {
    const root = buildEnterpriseRootLink({ enterpriseId: ENT, actorKind: "grossiste_a" });
    const link = buildPoleActivationLink({
      enterpriseId: ENT,
      poleId: pole,
      parentEnterpriseToken: root.secureToken,
    });
    expect(link.url).toContain(GROSSISTE_A_POLE_SLUGS[pole]);
    expect(link.signature).toMatch(/^sig-/);
  });
});
