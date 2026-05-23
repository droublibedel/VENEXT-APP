import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isCommerceUxHarmonyEnabled,
  resolveEmptyState,
  resolveErrorState,
  runCommerceUxHarmonyAudit,
} from "./commerce-ux-audit";
import { getEmptyStateMessage } from "./commerce-ux-empty-messages";
import { getErrorStateMessage } from "./commerce-ux-error-messages";
import {
  evaluateMobileSurfaceHarmony,
  MOBILE_MIN_TOUCH_PX,
  mobileButtonStyle,
} from "./commerce-ux-mobile-rules";
import { evaluateNavigationHarmony, maxQuickActionsForPlatform } from "./commerce-ux-navigation-rules";
import { auditVisibleCopy, harmonizeVisibleCopy } from "./commerce-ux-wording-audit";
import { VenextCommerceEmptyState } from "./VenextCommerceEmptyState";
import { VenextCommerceErrorState } from "./VenextCommerceErrorState";
import { VenextCommerceScreenHeader } from "./VenextCommerceScreenHeader";

afterEach(() => cleanup());

describe("commerce-ux-harmony flags", () => {
  it("enabled by default", () => {
    expect(isCommerceUxHarmonyEnabled({})).toBe(true);
  });
  it("respects explicit disable", () => {
    expect(isCommerceUxHarmonyEnabled({ commerce_ux_harmony_enabled: false })).toBe(false);
  });
});

describe("empty state messages", () => {
  const keys = [
    "catalog",
    "orders",
    "notifications",
    "deliveries",
    "relations",
    "messages",
    "wallet",
    "activity",
    "offline",
    "generic",
  ] as const;

  for (const key of keys) {
    it(`fr-CI empty ${key} is commerce-first`, () => {
      const msg = getEmptyStateMessage(key, "fr-CI", "terrain");
      expect(msg.length).toBeGreaterThan(3);
      expect(auditVisibleCopy(msg).ok).toBe(true);
    });
  }

  it("en catalog differs from fr", () => {
    expect(getEmptyStateMessage("catalog", "en")).toContain("catalog");
  });

  it("ar generic is RTL-safe string", () => {
    expect(getEmptyStateMessage("generic", "ar").length).toBeGreaterThan(2);
  });

  it("zh catalog is short", () => {
    expect(getEmptyStateMessage("catalog", "zh-CN").length).toBeLessThan(40);
  });

  it("resolveEmptyState returns title", () => {
    expect(resolveEmptyState("orders").title).toContain("commande");
  });

  it("offline hint optional", () => {
    const r = resolveEmptyState("offline");
    expect(r.title.length).toBeGreaterThan(5);
  });
});

describe("error state messages", () => {
  const keys = [
    "access_denied",
    "wallet_inactive",
    "session_locked",
    "offline",
    "relation_inactive",
    "generic",
  ] as const;

  for (const key of keys) {
    it(`error ${key} hides technical jargon`, () => {
      const msg = getErrorStateMessage(key);
      expect(msg.toLowerCase()).not.toContain("unauthorized");
      expect(msg.toLowerCase()).not.toContain("forbidden");
      expect(auditVisibleCopy(msg).ok).toBe(true);
    });
  }

  it("resolveErrorState wallet", () => {
    expect(resolveErrorState("wallet_inactive").title.toLowerCase()).toContain("règlement");
  });

  it("en access denied human", () => {
    expect(getErrorStateMessage("access_denied", "en").toLowerCase()).toContain("partner");
  });
});

describe("wording audit anti-jargon", () => {
  const forbidden = [
    "workflow",
    "pipeline",
    "ticket",
    "ERP dashboard",
    "supply chain",
    "engagement social",
    "ranking",
    "unauthorized",
    "forbidden",
  ];

  for (const word of forbidden) {
    it(`rejects ${word}`, () => {
      expect(auditVisibleCopy(`Voir le ${word}`).ok).toBe(false);
    });
  }

  it("accepts commerce-first copy", () => {
    expect(auditVisibleCopy("Commande partenaire en cours").ok).toBe(true);
  });

  it("harmonize strips enterprise tone", () => {
    const out = harmonizeVisibleCopy("Tableau de bord ERP");
    expect(out.toLowerCase()).not.toContain("erp");
  });

  it("accepts livraison wording", () => {
    expect(auditVisibleCopy("Livraison partenaire confirmée").ok).toBe(true);
  });
});

describe("navigation harmony", () => {
  it("depth 1 mobile ok", () => {
    expect(evaluateNavigationHarmony({ platform: "mobile", depth: 1 }).ok).toBe(true);
  });
  it("depth 3 fails", () => {
    expect(evaluateNavigationHarmony({ platform: "mobile", depth: 3 }).ok).toBe(false);
  });
  it("web depth 2 ok", () => {
    expect(evaluateNavigationHarmony({ platform: "web", depth: 2, hasQuickReturn: true }).ok).toBe(true);
  });
  it("modal stack warns", () => {
    const r = evaluateNavigationHarmony({ platform: "web", depth: 1, modalCount: 2 });
    expect(r.hints.length).toBeGreaterThan(0);
  });
  it("max quick actions mobile is 5", () => {
    expect(maxQuickActionsForPlatform("mobile")).toBe(5);
  });
  it("max quick actions web is 8", () => {
    expect(maxQuickActionsForPlatform("web")).toBe(8);
  });
});

describe("mobile surface harmony", () => {
  it("5 actions ok", () => {
    expect(evaluateMobileSurfaceHarmony({ quickActionCount: 5, panelCount: 1 }).ok).toBe(true);
  });
  it("8 actions fail on mobile default", () => {
    expect(evaluateMobileSurfaceHarmony({ quickActionCount: 8, panelCount: 1 }).ok).toBe(false);
  });
  it("touch target minimum 44", () => {
    expect(MOBILE_MIN_TOUCH_PX).toBe(44);
    expect(mobileButtonStyle().minHeight).toBe(44);
  });
  it("web allows more actions", () => {
    expect(
      evaluateMobileSurfaceHarmony({
        platform: "web",
        quickActionCount: 7,
        panelCount: 2,
      }).ok,
    ).toBe(true);
  });
});

describe("runCommerceUxHarmonyAudit", () => {
  it("passes clean surface", () => {
    const r = runCommerceUxHarmonyAudit({
      platform: "mobile",
      actorKind: "terrain",
      depth: 1,
      quickActionCount: 4,
      panelCount: 1,
      visibleLabels: ["Commandes", "Livraisons"],
    });
    expect(r.ok).toBe(true);
    expect(Object.keys(r.cssVariables).length).toBeGreaterThan(0);
  });

  it("fails deep navigation with jargon labels", () => {
    const r = runCommerceUxHarmonyAudit({
      platform: "web",
      actorKind: "formal",
      depth: 4,
      quickActionCount: 3,
      panelCount: 2,
      visibleLabels: ["workflow pipeline"],
    });
    expect(r.ok).toBe(false);
  });

  it("formal web with relations label", () => {
    const r = runCommerceUxHarmonyAudit({
      platform: "web",
      actorKind: "formal",
      depth: 2,
      quickActionCount: 6,
      panelCount: 2,
      visibleLabels: ["Réseau professionnel", "Mail partenaire"],
    });
    expect(r.navigation.ok).toBe(true);
  });
});

describe("VenextCommerceEmptyState", () => {
  it("renders catalog empty", () => {
    render(<VenextCommerceEmptyState stateKey="catalog" />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText(/catalogue/i)).toBeTruthy();
  });
  it("renders custom hint", () => {
    render(<VenextCommerceEmptyState stateKey="orders" hint="Revenez plus tard" />);
    expect(screen.getByText("Revenez plus tard")).toBeTruthy();
  });
  it("renders en locale", () => {
    render(<VenextCommerceEmptyState stateKey="notifications" locale="en" />);
    expect(screen.getByText(/notification/i)).toBeTruthy();
  });
  it("renders wallet empty", () => {
    render(<VenextCommerceEmptyState stateKey="wallet" />);
    expect(screen.getByText(/règlement/i)).toBeTruthy();
  });
});

describe("VenextCommerceErrorState", () => {
  it("renders alert role", () => {
    render(<VenextCommerceErrorState stateKey="offline" />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });
  it("wallet inactive copy", () => {
    render(<VenextCommerceErrorState stateKey="wallet_inactive" />);
    expect(screen.getByText(/règlement/i)).toBeTruthy();
  });
  it("session locked copy", () => {
    render(<VenextCommerceErrorState stateKey="session_locked" />);
    expect(screen.getByText(/session/i)).toBeTruthy();
  });
});

describe("VenextCommerceScreenHeader", () => {
  it("renders title and back", () => {
    const onBack = vi.fn();
    render(
      <VenextCommerceScreenHeader title="Commandes" subtitle="Partenaire" onBack={onBack} />,
    );
    expect(screen.getByRole("heading", { name: "Commandes" })).toBeTruthy();
    screen.getByRole("button", { name: /retour/i }).click();
    expect(onBack).toHaveBeenCalled();
  });
  it("web platform class", () => {
    const { container } = render(
      <VenextCommerceScreenHeader title="Catalogue" platform="web" />,
    );
    expect(container.querySelector(".venext-screen-header--web")).toBeTruthy();
  });
});

describe("i18n overflow smoke", () => {
  const longEn =
    "International commercial partner relationship overview for recurring orders";
  it("long english title still audits", () => {
    expect(auditVisibleCopy(longEn).ok).toBe(true);
  });
  it("mandarin empty generic", () => {
    expect(getEmptyStateMessage("generic", "zh").length).toBeGreaterThan(1);
  });
  it("fr deliveries message", () => {
    expect(getEmptyStateMessage("deliveries")).toMatch(/livraison/i);
  });
});

describe("RTL smoke", () => {
  it("ar error access", () => {
    expect(getErrorStateMessage("access_denied", "ar").length).toBeGreaterThan(5);
  });
  it("ar empty catalog", () => {
    expect(getEmptyStateMessage("catalog", "ar").length).toBeGreaterThan(3);
  });
});

describe("formal vs terrain actor", () => {
  it("terrain catalog message", () => {
    expect(getEmptyStateMessage("catalog", "fr-CI", "terrain")).toMatch(/catalogue/i);
  });
  it("formal uses same keys", () => {
    expect(getEmptyStateMessage("orders", "fr-CI", "formal")).toMatch(/commande/i);
  });
});

describe("notification and activity empty keys", () => {
  it("notifications key", () => {
    expect(getEmptyStateMessage("notifications")).toMatch(/notification/i);
  });
  it("activity key", () => {
    expect(getEmptyStateMessage("activity")).toMatch(/activité/i);
  });
  it("messages key", () => {
    expect(getEmptyStateMessage("messages")).toMatch(/message/i);
  });
});

describe("wallet locked and offline errors", () => {
  it("wallet inactive not fintech", () => {
    const t = getErrorStateMessage("wallet_inactive");
    expect(t.toLowerCase()).not.toContain("iban");
    expect(t.toLowerCase()).not.toContain("crypto");
  });
  it("offline error human", () => {
    expect(getErrorStateMessage("offline")).toMatch(/connexion|hors/i);
  });
});

describe("context return navigation", () => {
  it("requires quick return at depth 2", () => {
    const ok = evaluateNavigationHarmony({
      platform: "mobile",
      depth: 2,
      hasQuickReturn: true,
    });
    expect(ok.ok).toBe(true);
  });
  it("missing quick return at depth 2 fails guardrails nav", () => {
    const ok = evaluateNavigationHarmony({
      platform: "mobile",
      depth: 2,
      hasQuickReturn: false,
    });
    expect(ok.ok).toBe(false);
  });
});
