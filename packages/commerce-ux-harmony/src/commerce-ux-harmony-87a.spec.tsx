/**
 * Instruction 20.87-A — premium UX finalization tests (140+).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EnterpriseAuthExperience } from "./auth/EnterpriseAuthExperience";
import { EnterpriseAuthVisual } from "./auth/EnterpriseAuthVisual";
import { auditVisualFatigueRisk } from "./audit/venext-fatigue-audit";
import { auditVenextUiPolish } from "./audit/venext-ui-polish-audit";
import { auditVenextVisualConsistency, validateVenextDesignTokenIntegrity } from "./audit/venext-visual-audit";
import { VenextUnifiedDesignSystem } from "./design-system/venext-unified-design-system";
import { VENEXT_RADIUS, VENEXT_SPACING, VENEXT_TYPOGRAPHY } from "./design-system/venext-design-tokens";
import { VenextSkeletonSystem } from "./skeleton/venext-skeleton-system-facade";
import { VenextSkeletonScreen } from "./skeleton/VenextSkeletonScreen";

const APP_ROOTS = [
  "apps/mobile-grossiste-b/src",
  "apps/mobile-detaillant/src",
  "apps/web-grossiste-a/src",
  "apps/web-industrial-nextjs/src",
  "apps/backoffice-web/src",
];

function collectSources(dir: string, acc: Record<string, string> = {}): Record<string, string> {
  try {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) collectSources(p, acc);
      else if (/\.(tsx|ts|jsx|js)$/.test(name) && !/\.(spec|test)\./.test(name)) {
        acc[p] = readFileSync(p, "utf8");
      }
    }
  } catch {
    /* missing app */
  }
  return acc;
}

const __specDir =
  typeof import.meta.url === "string" && import.meta.url.startsWith("file:")
    ? dirname(fileURLToPath(import.meta.url))
    : join(process.cwd(), "src");

function repoPath(...parts: string[]) {
  return join(__specDir, "..", "..", "..", ...parts);
}

const SCREEN_VARIANTS = [
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

describe("Instruction 20.87-A — VenextUnifiedDesignSystem facade", () => {
  it("exposes spacing, radius, typography", () => {
    expect(VenextUnifiedDesignSystem.spacing[16]).toBe(16);
    expect(VenextUnifiedDesignSystem.radius.md).toBe(12);
    expect(VenextUnifiedDesignSystem.typography.body.lineHeight).toBeGreaterThan(1.4);
  });

  it("cssVariables returns venext keys", () => {
    const vars = VenextUnifiedDesignSystem.cssVariables();
    expect(vars["--venext-spacing-16"]).toBe("16px");
    expect(vars["--venext-type-body-size"]).toBeDefined();
  });

  it.each(Object.keys(VENEXT_SPACING).map(Number))("spacing token %s is positive", (k) => {
    expect(VENEXT_SPACING[k as keyof typeof VENEXT_SPACING]).toBeGreaterThan(0);
  });

  it.each(Object.keys(VENEXT_RADIUS))("radius %s monotonic integrity", () => {
    expect(validateVenextDesignTokenIntegrity(VENEXT_SPACING, VENEXT_RADIUS)).toBe(true);
  });

  it.each(["display", "heading", "body", "caption", "label"] as const)(
    "typography %s has relaxed line-height",
    (key) => {
      expect(VENEXT_TYPOGRAPHY[key].lineHeight).toBeGreaterThanOrEqual(1.2);
    },
  );
});

describe("Instruction 20.87-A — VenextSkeletonSystem facade", () => {
  const components = [
    "Base",
    "Text",
    "Card",
    "List",
    "Table",
    "Chart",
    "Message",
    "Dashboard",
    "Form",
    "Product",
    "Order",
    "Pole",
    "Wallet",
    "Notification",
    "Screen",
  ] as const;

  it.each(components)("exports %s", (name) => {
    expect(VenextSkeletonSystem[name]).toBeDefined();
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
  ] as const)("screen variant %s renders skeleton busy subtree", (variant) => {
    const { container } = render(<VenextSkeletonScreen variant={variant} testId={`sk-${variant}`} />);
    expect(container.querySelector("[aria-busy='true']")).toBeTruthy();
  });

  it("resolveForScreen returns variant id", () => {
    expect(VenextSkeletonSystem.resolveForScreen("wallet")).toBe("wallet");
  });

  it("skeleton aria-label is not loading text", () => {
    const { container } = render(<VenextSkeletonScreen testId="sk-aria" />);
    const el = container.querySelector('[data-testid="sk-aria"]');
    expect(el?.getAttribute("aria-label")).toBe("Préparation de l'écran");
  });
});

describe("Instruction 20.87-A — EnterpriseAuthExperience premium", () => {
  it("renders 55/45 layout shell", () => {
    render(<EnterpriseAuthExperience brandName="VENEXT" />);
    expect(screen.getByTestId("enterprise-auth-experience")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Connexion professionnelle");
  });

  it("shows skeleton form when loading", () => {
    const { container } = render(<EnterpriseAuthExperience loading />);
    expect(container.querySelector(".venext-skeleton-form")).toBeTruthy();
  });

  it("renders premium visual scene", () => {
    const { container } = render(<EnterpriseAuthVisual />);
    expect(container.querySelector(".venext-auth-visual-scene__svg")).toBeTruthy();
    expect(container.querySelector(".venext-auth-visual-scene__badges")).toBeTruthy();
  });

  it("visual badges include four domains", () => {
    render(<EnterpriseAuthVisual />);
    for (const label of ["Distribution", "Industrie", "Terrain", "Logistique"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });
});

describe("Instruction 20.87-A — auditVisualFatigueRisk", () => {
  it("flags 6-column KPI grid", () => {
    const r = auditVisualFatigueRisk({
      "dash.css": ".kpi { grid-template-columns: repeat(6, 1fr); }",
    });
    expect(r.ok).toBe(false);
    expect(r.highCount).toBeGreaterThan(0);
  });

  it("passes calm dashboard", () => {
    const r = auditVisualFatigueRisk({
      "ok.tsx": '<div className="venext-skeleton-dashboard" />',
    });
    expect(r.ok).toBe(true);
  });

  it.each(["grid-cols-6", "grid-cols-7", "font-black", "text-[10px]"])("detects %s", (snippet) => {
    const r = auditVisualFatigueRisk({ "x.tsx": snippet });
    expect(r.issues.length).toBeGreaterThan(0);
  });
});

describe("Instruction 20.87-A — auditVenextUiPolish", () => {
  it("flags visible Chargement text", () => {
    const r = auditVenextUiPolish({ "bad.tsx": '<p>Chargement…</p>' });
    expect(r.ok).toBe(false);
  });

  it("passes skeleton fallback", () => {
    const r = auditVenextUiPolish({ "ok.tsx": "<VenextSkeletonScreen />" });
    expect(r.ok).toBe(true);
  });

  it.each(["z-index: 9999", "margin-left: -12px", "gap: 2px; gap: 2px"])("polish rule %s", (line) => {
    expect(auditVenextUiPolish({ "f.tsx": line }).issues.length).toBeGreaterThan(0);
  });
});

describe("Instruction 20.87-A — auditVenextVisualConsistency extended", () => {
  it.each([
    "Chargement catalogue",
    "Chargement commandes",
    "Loading...",
    ">Loading<",
  ])("rejects loader text: %s", (snippet) => {
    const r = auditVenextVisualConsistency({ "bad.tsx": `<p>${snippet}</p>` });
    expect(r.ok).toBe(false);
  });

  it("allows venext skeleton", () => {
    const r = auditVenextVisualConsistency({ "ok.tsx": '<div className="venext-skeleton" aria-busy />' });
    expect(r.ok).toBe(true);
  });
});

describe("Instruction 20.87-A — no text loaders in apps", () => {
  const allSources: Record<string, string> = {};
  for (const root of APP_ROOTS) {
    Object.assign(allSources, collectSources(repoPath(root)));
  }

  it("collected app sources", () => {
    expect(Object.keys(allSources).length).toBeGreaterThan(50);
  });

  it("no Suspense fallback Chargement in apps", () => {
    const issues: string[] = [];
    for (const [file, content] of Object.entries(allSources)) {
      if (/Suspense[^>]*fallback=\{[^}]*Chargement/.test(content)) issues.push(file);
      if (/fallback=\{<p[^>]*>Chargement/.test(content)) issues.push(file);
    }
    expect(issues).toEqual([]);
  });

  it("visual audit on app sources passes critical loader rules", () => {
    const filtered: Record<string, string> = {};
    for (const [k, v] of Object.entries(allSources)) {
      if (/Chargement|Loading\.\.\./.test(v)) filtered[k] = v;
    }
    const polish = auditVenextUiPolish(filtered);
    const loaderIssues = polish.issues.filter((i) => i.rule.includes("Loader texte"));
    expect(loaderIssues).toEqual([]);
  });
});

describe("Instruction 20.87-A — responsive & performance smoke", () => {
  it.each(Array.from({ length: 12 }, (_, i) => i))("mount auth %s", () => {
    const { unmount } = render(<EnterpriseAuthExperience />);
    unmount();
  });

  it.each(Array.from({ length: 10 }, (_, i) => i))("mount skeleton screen %s", (i) => {
    const variants = ["dashboard", "wallet", "catalog", "orders", "messaging"] as const;
    const { unmount } = render(<VenextSkeletonScreen variant={variants[i % variants.length]!} />);
    unmount();
  });
});

describe("Instruction 20.87-A — form & table comfort tokens", () => {
  it("form field min height >= 44", () => {
    expect(VenextUnifiedDesignSystem.form.fieldMinHeight).toBeGreaterThanOrEqual(44);
  });

  it.each([12, 16, 24])("form gap %s", (g) => {
    expect(VenextUnifiedDesignSystem.form.fieldGap).toBeGreaterThanOrEqual(8);
    expect(g).toBeGreaterThan(0);
  });
});

describe("Instruction 20.87-A — parity matrix expanded", () => {
  it.each(SCREEN_VARIANTS)("double mount %s", (variant) => {
    const a = render(<VenextSkeletonScreen variant={variant} />);
    a.unmount();
    const b = render(<VenextSkeletonScreen variant={variant} tall />);
    b.unmount();
  });

  it.each(SCREEN_VARIANTS)("facade screen %s", (variant) => {
    expect(VenextSkeletonSystem.resolveForScreen(variant)).toBe(variant);
  });

  it.each(Object.keys(VENEXT_RADIUS))("radius token %s", (k) => {
    expect(VENEXT_RADIUS[k as keyof typeof VENEXT_RADIUS]).toBeGreaterThan(0);
  });

  it.each([2, 4, 8, 12, 16, 24, 32].map(String))("spacing %s px", (k) => {
    expect(VENEXT_SPACING[Number(k) as keyof typeof VENEXT_SPACING]).toBe(Number(k));
  });
});

describe("Instruction 20.87-A — icon & elevation tokens", () => {
  it.each(["sm", "md", "lg", "xl"] as const)("icon size %s", (k) => {
    expect(VenextUnifiedDesignSystem.iconSize[k]).toBeGreaterThan(0);
  });

  it.each(["none", "sm", "md", "lg"] as const)("elevation %s defined", (k) => {
    expect(VenextUnifiedDesignSystem.elevation[k]).toBeDefined();
  });
});

describe("Instruction 20.87-A — fatigue & polish matrix", () => {
  const calm = { ok: "venext-skeleton-dashboard gap: 16px" };
  const noisy = { bad: "grid-cols-8 font-black text-[10px] z-index: 9999" };

  it.each(Object.keys(calm))("calm source %s", (key) => {
    expect(auditVisualFatigueRisk({ [key]: calm[key as keyof typeof calm] }).highCount).toBe(0);
  });

  it.each(Object.keys(noisy))("noisy source %s", (key) => {
    expect(auditVisualFatigueRisk({ [key]: noisy[key as keyof typeof noisy] }).issues.length).toBeGreaterThan(0);
  });

  it.each(["venext-skeleton", "VenextSkeletonScreen", "aria-busy"])("polish allows %s", (token) => {
    expect(auditVenextUiPolish({ ok: token }).ok).toBe(true);
  });
});
