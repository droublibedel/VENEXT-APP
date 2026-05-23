import { describe, expect, it } from "vitest";

import {
  assertCommunicationNotSocial,
  assertFormalUsesMailNotSocialFeed,
  assertTerrainUsesMessagingNotMailWizard,
  communicationSeparationHint,
  resolveCommunicationChannel,
} from "./commerce-communication.guard";
import {
  assertDeliveryStaysLightweight,
  assertDeliveryUiAllowed,
  deliveryLightweightPrinciples,
} from "./commerce-delivery-lightweight.guard";
import { designRulesSummary } from "./commerce-foundation-design-rules";
import { buildCommerceComplexityScore } from "./commerce-foundation-complexity.guard";
import {
  commercePhilosophyReminder,
  isCommerceFirstSurface,
  isCommerceFoundationGuardrailsEnabled,
  resolveCommerceActorKind,
} from "./commerce-foundation-philosophy.guard";
import { evaluateCommerceUxSurface } from "./commerce-foundation-ux.guard";
import {
  assertInlineConfirmationOnly,
  buildStandardCommerceInteractionSurface,
  normalizeQuickAction,
} from "./commerce-interaction-patterns";
import {
  evaluatePlatformConsistency,
  platformDensityLabel,
  resolveExpectedPlatform,
} from "./commerce-platform-consistency.guard";
import {
  assertWalletNotFintech,
  sanitizeWalletFoundationText,
  walletPhilosophyLabels,
} from "./commerce-wallet-philosophy.guard";

describe("commerce foundation philosophy (20.74-A)", () => {
  it("guardrails enabled by default", () => {
    expect(isCommerceFoundationGuardrailsEnabled({})).toBe(true);
  });

  it("resolves actor kinds", () => {
    expect(resolveCommerceActorKind("detaillant")).toBe("terrain");
    expect(resolveCommerceActorKind("producteur")).toBe("formal");
  });

  it("commerce-first surfaces", () => {
    expect(isCommerceFirstSurface("roo-order-detail")).toBe(true);
    expect(isCommerceFirstSurface("erp-supply-panel")).toBe(false);
  });

  it("philosophy reminder", () => {
    expect(commercePhilosophyReminder()).toMatch(/intelligence économique/i);
  });
});

describe("delivery lightweight guard (20.74-A)", () => {
  it("blocks gps fleet features", () => {
    expect(assertDeliveryStaysLightweight("GPS temps réel flotte")).toBe(false);
  });

  it("allows commercial delivery", () => {
    expect(assertDeliveryStaysLightweight("Livraison partenaire")).toBe(true);
  });

  it("blocks forbidden ui test ids", () => {
    expect(assertDeliveryUiAllowed("gps-tracking")).toBe(false);
  });

  it("principles list", () => {
    expect(deliveryLightweightPrinciples().length).toBeGreaterThan(2);
  });
});

describe("wallet philosophy guard (20.74-A)", () => {
  it("anti fintech", () => {
    expect(assertWalletNotFintech("trading desk")).toBe(false);
    expect(assertWalletNotFintech("règlement partenaire")).toBe(true);
  });

  it("sanitize wallet text", () => {
    expect(sanitizeWalletFoundationText("neobank dashboard")).not.toMatch(/neobank/i);
  });

  it("wallet labels commerce-first", () => {
    expect(walletPhilosophyLabels().settlement).toMatch(/relationnel/i);
  });
});

describe("communication guard (20.74-A)", () => {
  it("formal uses mail", () => {
    expect(resolveCommunicationChannel("producteur")).toBe("professional-mail");
  });

  it("terrain uses messaging", () => {
    expect(resolveCommunicationChannel("grossiste_b")).toBe("commerce-messaging");
  });

  it("anti social", () => {
    expect(assertCommunicationNotSocial("feed communauté")).toBe(false);
  });

  it("formal no social feed ui", () => {
    expect(assertFormalUsesMailNotSocialFeed("producteur", "social-feed")).toBe(false);
  });

  it("terrain no mail wizard", () => {
    expect(assertTerrainUsesMessagingNotMailWizard("detaillant", "mail-compose-wizard")).toBe(
      false,
    );
  });

  it("separation hint", () => {
    expect(communicationSeparationHint("grossiste_b")).toMatch(/rapide/i);
  });
});

describe("platform consistency (20.74-A)", () => {
  it("expected platform by role", () => {
    expect(resolveExpectedPlatform("detaillant")).toBe("mobile");
    expect(resolveExpectedPlatform("grossiste_a")).toBe("web");
  });

  it("mobile terrain needs summary", () => {
    const r = evaluatePlatformConsistency({
      platform: "mobile",
      role: "detaillant",
      panelCount: 2,
      hasMobileSummary: false,
      quickActionCount: 3,
    });
    expect(r.ok).toBe(false);
  });

  it("density labels", () => {
    expect(platformDensityLabel("mobile")).toBe("terrain-rapide");
  });
});

describe("interaction patterns (20.74-A)", () => {
  it("normalizes quick action inline", () => {
    const a = normalizeQuickAction("confirm", "Confirmer");
    expect(a.inline).toBe(true);
  });

  it("caps quick actions when guardrails on", () => {
    const surface = buildStandardCommerceInteractionSurface(
      Array.from({ length: 12 }, (_, i) => ({ id: `a${i}`, label: `A${i}` })),
    );
    expect(surface.quickActions.length).toBeLessThanOrEqual(8);
  });

  it("inline confirmation only", () => {
    expect(assertInlineConfirmationOnly(false)).toBe(true);
    expect(assertInlineConfirmationOnly(true)).toBe(false);
  });
});

describe("complexity score internal (20.74-A)", () => {
  it("low for simple surface", () => {
    expect(buildCommerceComplexityScore({
      panelCount: 2,
      quickActionCount: 3,
      timelineStepCount: 7,
      formFieldCount: 0,
    }).level).toBe("low");
  });

  it("high for overloaded surface", () => {
    expect(
      buildCommerceComplexityScore({
        panelCount: 8,
        quickActionCount: 12,
        timelineStepCount: 15,
        formFieldCount: 20,
        modalCount: 2,
        navigationDepth: 4,
      }).level,
    ).toBe("high");
  });
});

describe("ux evaluation (20.74-A)", () => {
  it("acceptable simple commerce shell", () => {
    const r = evaluateCommerceUxSurface({
      panelCount: 3,
      quickActionCount: 5,
      timelineStepCount: 8,
      formFieldCount: 0,
    });
    expect(r.acceptable).toBe(true);
  });
});

describe("design rules (20.74-A)", () => {
  it("summarizes harmonization", () => {
    expect(designRulesSummary().some((s) => s.includes("Timelines"))).toBe(true);
  });
});
