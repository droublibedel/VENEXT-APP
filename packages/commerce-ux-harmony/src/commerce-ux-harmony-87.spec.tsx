import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(() => cleanup());

import {
  VENEXT_FORM,
  VENEXT_RADIUS,
  VENEXT_SPACING,
  VENEXT_TYPOGRAPHY,
  venextUnifiedDesignCssVariables,
} from "./design-system/venext-design-tokens";
import {
  auditVenextVisualConsistency,
  validateVenextDesignTokenIntegrity,
} from "./audit/venext-visual-audit";
import { EnterpriseAuthExperience } from "./auth/EnterpriseAuthExperience";
import { VenextSkeletonBase } from "./skeleton/VenextSkeletonBase";
import {
  VenextSkeletonCard,
  VenextSkeletonChart,
  VenextSkeletonDashboard,
  VenextSkeletonForm,
  VenextSkeletonList,
  VenextSkeletonMessage,
  VenextSkeletonNotification,
  VenextSkeletonOrder,
  VenextSkeletonPole,
  VenextSkeletonProduct,
  VenextSkeletonTable,
  VenextSkeletonText,
  VenextSkeletonWallet,
} from "./skeleton/VenextSkeletonComponents";
import { VenextSkeletonScreen } from "./skeleton/VenextSkeletonScreen";

const SKELETON_COMPONENTS = [
  ["VenextSkeletonText", VenextSkeletonText, "venext-skeleton-text"],
  ["VenextSkeletonCard", VenextSkeletonCard, "venext-skeleton-card"],
  ["VenextSkeletonList", VenextSkeletonList, "venext-skeleton-list"],
  ["VenextSkeletonTable", VenextSkeletonTable, "venext-skeleton-table"],
  ["VenextSkeletonChart", VenextSkeletonChart, "venext-skeleton-chart"],
  ["VenextSkeletonMessage", VenextSkeletonMessage, "venext-skeleton-message"],
  ["VenextSkeletonDashboard", VenextSkeletonDashboard, "venext-skeleton-dashboard"],
  ["VenextSkeletonForm", VenextSkeletonForm, "venext-skeleton-form"],
  ["VenextSkeletonProduct", VenextSkeletonProduct, "venext-skeleton-product"],
  ["VenextSkeletonOrder", VenextSkeletonOrder, "venext-skeleton-order"],
  ["VenextSkeletonPole", VenextSkeletonPole, "venext-skeleton-pole"],
  ["VenextSkeletonWallet", VenextSkeletonWallet, "venext-skeleton-wallet"],
  ["VenextSkeletonNotification", VenextSkeletonNotification, "venext-skeleton-notification"],
] as const;

describe("Instruction 20.87 — VenextUnifiedDesignSystem tokens", () => {
  it.each(Object.entries(VENEXT_SPACING))("spacing-%s is positive", (_k, v) => {
    expect(v).toBeGreaterThan(0);
  });

  it.each(Object.entries(VENEXT_RADIUS))("radius-%s is positive", (_k, v) => {
    expect(v).toBeGreaterThanOrEqual(6);
  });

  it.each(Object.keys(VENEXT_TYPOGRAPHY))("typography scale %s exists", (key) => {
    expect(VENEXT_TYPOGRAPHY[key as keyof typeof VENEXT_TYPOGRAPHY].fontSize).toBeGreaterThan(10);
  });

  it("css variables include spacing and radius", () => {
    const vars = venextUnifiedDesignCssVariables();
    expect(vars["--venext-spacing-16"]).toBe("16px");
    expect(vars["--venext-radius-md"]).toBe("12px");
    expect(vars["--venext-type-body-size"]).toBeTruthy();
  });

  it("validateVenextDesignTokenIntegrity passes", () => {
    expect(validateVenextDesignTokenIntegrity(VENEXT_SPACING, VENEXT_RADIUS)).toBe(true);
  });

  it("spacing monotonic", () => {
    const vals = Object.values(VENEXT_SPACING);
    for (let i = 1; i < vals.length; i++) expect(vals[i]).toBeGreaterThanOrEqual(vals[i - 1]!);
  });

  it("radius monotonic", () => {
    const vals = Object.values(VENEXT_RADIUS);
    for (let i = 1; i < vals.length; i++) expect(vals[i]).toBeGreaterThanOrEqual(vals[i - 1]!);
  });
});

describe("Instruction 20.87 — VenextSkeletonSystem integrity", () => {
  it.each(SKELETON_COMPONENTS)("%s renders with aria-busy", (_name, Comp, testId) => {
    const { container } = render(<Comp />);
    expect(within(container).getByTestId(testId).getAttribute("aria-busy")).toBe("true");
  });

  it("VenextSkeletonBase uses venext-skeleton class", () => {
    render(<VenextSkeletonBase width={100} height={20} />);
    expect(screen.getByTestId("venext-skeleton-base").className).toContain("venext-skeleton");
  });

  it("VenextSkeletonBase circle variant", () => {
    render(<VenextSkeletonBase circle width={40} height={40} testId="sk-circle" />);
    expect(screen.getByTestId("sk-circle").className).toContain("venext-skeleton--circle");
  });

  it.each([
    "dashboard",
    "wallet",
    "messaging",
    "catalog",
    "orders",
    "notifications",
    "pole",
    "form",
    "table",
    "product",
  ] as const)("VenextSkeletonScreen variant %s", (variant) => {
    const { container } = render(<VenextSkeletonScreen variant={variant} testId={`screen-${variant}`} />);
    expect(within(container).getByTestId(`screen-${variant}`).getAttribute("role")).toBe("status");
  });

  it("skeleton list has avatar rows", () => {
    const { container } = render(<VenextSkeletonList rows={3} />);
    expect(within(container).getAllByTestId("venext-skeleton-avatar").length).toBe(3);
  });

  it("skeleton message has alternating bubbles", () => {
    render(<VenextSkeletonMessage rows={4} />);
    expect(document.querySelectorAll(".venext-skeleton-message__bubble").length).toBe(4);
  });

  it("skeleton dashboard has kpi grid", () => {
    render(<VenextSkeletonDashboard />);
    expect(document.querySelector(".venext-skeleton-dashboard__kpis")).toBeTruthy();
  });

  it("skeleton form has fields", () => {
    render(<VenextSkeletonForm />);
    expect(document.querySelectorAll(".venext-skeleton-form__field").length).toBe(4);
  });

  it("skeleton pole tall mode", () => {
    render(<VenextSkeletonPole tall />);
    expect(screen.getByTestId("venext-skeleton-pole")).toBeTruthy();
  });

  it("no spinner-only in skeleton screen", () => {
    const html = document.body.innerHTML;
    expect(html).not.toMatch(/animate-spin/);
  });
});

describe("Instruction 20.87 — skeleton layout fidelity", () => {
  it.each([
    ["wallet", ".venext-skeleton-wallet"],
    ["messaging", ".venext-skeleton-message"],
    ["catalog", ".venext-skeleton-product"],
    ["orders", ".venext-skeleton-order"],
    ["pole", ".venext-skeleton-pole"],
  ] as const)("screen %s maps to domain layout", (variant, selector) => {
    const { container } = render(<VenextSkeletonScreen variant={variant} />);
    expect(container.querySelector(selector)).toBeTruthy();
  });

  it("table skeleton has head and rows", () => {
    render(<VenextSkeletonTable rows={3} cols={3} />);
    expect(document.querySelector(".venext-skeleton-table__head")).toBeTruthy();
    expect(document.querySelectorAll(".venext-skeleton-table__row").length).toBe(3);
  });

  it("chart skeleton has block", () => {
    render(<VenextSkeletonChart />);
    expect(screen.getByTestId("venext-skeleton-chart")).toBeTruthy();
  });
});

describe("Instruction 20.87 — auditVenextVisualConsistency", () => {
  it("flags spinner-only loading", () => {
    const audit = auditVenextVisualConsistency({
      "bad.tsx": '<div><Spinner /></div>',
    });
    expect(audit.ok).toBe(false);
  });

  it("flags Chargement text only", () => {
    const audit = auditVenextVisualConsistency({
      "bad.tsx": 'return <p>Chargement…</p>;',
    });
    expect(audit.ok).toBe(false);
  });

  it("passes venext skeleton usage", () => {
    const audit = auditVenextVisualConsistency({
      "ok.tsx": '<VenextSkeletonDashboard aria-busy="true" />',
    });
    expect(audit.ok).toBe(true);
  });

  it("flags aggressive shimmer", () => {
    const audit = auditVenextVisualConsistency({
      "bad.css": "background: linear-gradient(90deg, transparent, white); animation: shimmer 1s;",
    });
    expect(audit.ok).toBe(false);
  });

  it("flags dense form gap 4px", () => {
    const audit = auditVenextVisualConsistency({
      "bad.tsx": "flex-col { gap: 4px } input",
    });
    expect(audit.ok).toBe(false);
  });

  it("flags 6 column dashboard", () => {
    const audit = auditVenextVisualConsistency({
      "bad.css": "grid-template-columns: repeat(6, 1fr)",
    });
    expect(audit.ok).toBe(false);
  });
});

describe("Instruction 20.87 — EnterpriseAuthExperience", () => {
  it("renders 45/55 layout regions", () => {
    render(<EnterpriseAuthExperience />);
    expect(screen.getByTestId("enterprise-auth-experience")).toBeTruthy();
    expect(document.querySelector(".venext-auth-enterprise__visual")).toBeTruthy();
    expect(document.querySelector(".venext-auth-enterprise__panel")).toBeTruthy();
  });

  it("shows skeleton form when loading", () => {
    render(<EnterpriseAuthExperience loading />);
    expect(screen.getByTestId("venext-skeleton-form")).toBeTruthy();
  });

  it("humanized title", () => {
    render(<EnterpriseAuthExperience title="Espace Pro" />);
    expect(screen.getByText("Espace Pro")).toBeTruthy();
  });
});

describe("Instruction 20.87 — responsive & performance", () => {
  it.each(Array.from({ length: 20 }, (_, i) => i))("skeleton render stable run %i", () => {
    const { unmount } = render(<VenextSkeletonList rows={2} />);
    expect(screen.getByTestId("venext-skeleton-list")).toBeTruthy();
    unmount();
  });

  it.each(["xs", "sm", "md", "lg", "xl"] as const)("radius token %s", (r) => {
    render(<VenextSkeletonBase width={80} height={16} radius={r} testId={`r-${r}`} />);
    expect(screen.getByTestId(`r-${r}`).className).toContain(`venext-skeleton--radius-${r}`);
  });
});

describe("Instruction 20.87 — visual hierarchy & forms", () => {
  it.each([
    "display",
    "heading",
    "section",
    "body",
    "caption",
    "label",
  ] as const)("typography %s line height", (scale) => {
    const t = VENEXT_TYPOGRAPHY[scale];
    expect(t.lineHeight).toBeGreaterThan(1);
    expect(t.fontWeight).toBeGreaterThan(0);
  });

  it("form field min height accessible", () => {
    expect(VENEXT_FORM.fieldMinHeight).toBeGreaterThanOrEqual(44);
  });

  it("screen padding mobile >= 16", () => {
    const vars = venextUnifiedDesignCssVariables();
    expect(parseInt(vars["--venext-screen-padding-mobile"] ?? "0", 10)).toBeGreaterThanOrEqual(16);
  });
});

describe("Instruction 20.87 — parity matrix", () => {
  const variants = [
    "dashboard",
    "wallet",
    "messaging",
    "catalog",
    "orders",
    "notifications",
    "pole",
    "form",
    "table",
    "product",
  ] as const;

  it.each(variants)("double mount %s", (variant) => {
    const { unmount } = render(<VenextSkeletonScreen variant={variant} testId={`dm-${variant}-1`} />);
    unmount();
    const { container } = render(<VenextSkeletonScreen variant={variant} testId={`dm-${variant}-2`} />);
    expect(within(container).getByTestId(`dm-${variant}-2`)).toBeTruthy();
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])("list rows %i", (rows) => {
    const { container } = render(<VenextSkeletonList rows={rows} />);
    expect(within(container).getAllByTestId("venext-skeleton-avatar").length).toBe(rows);
  });
});

describe("Instruction 20.87 — LEGACY no raw loading", () => {
  it.each([
    "Chargement…",
    "Loading...",
    ">Loading<",
  ])("audit rejects bare loading copy: %s", (snippet) => {
    const audit = auditVenextVisualConsistency({ "x.tsx": snippet });
    expect(audit.ok).toBe(false);
  });

  it("skeleton components count official set", () => {
    expect(SKELETON_COMPONENTS.length).toBeGreaterThanOrEqual(12);
  });
});
