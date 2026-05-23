import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  auditGlobalHumanizedErrorsCoverage,
  auditVisibleUiErrorPatterns,
} from "./commerce-error-audit-global";
import {
  humanizeCaughtError,
  humanizeCommerceError,
  humanizeCommerceErrorMessage,
  isTechnicalErrorVisible,
} from "./commerce-humanized-errors";
import { getHumanizedErrorCopy } from "./commerce-error-i18n";
import {
  safeCatalogAction,
  safeEnterpriseGovernanceAction,
  safeMessagingAction,
  safeNotificationAction,
  safeWalletAction,
} from "./commerce-safe-domain-actions";
import { readdirSync, readFileSync, statSync } from "node:fs";

const VENEXT_APP_SRC_ROOTS = [
  "apps/mobile-grossiste-b/src",
  "apps/mobile-detaillant/src",
  "apps/web-grossiste-a/src",
  "apps/web-industrial-nextjs/src",
  "apps/backoffice-web/src",
] as const;

const VENEXT_BACKEND_SRC_ROOTS = [
  "services/commerce-bff/src",
  "services/core-domain-service/src",
] as const;

function collectAppSources(rootDir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string, depth: number) => {
    if (depth > 12) return;
    let entries: string[] = [];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
      const full = join(dir, name);
      if (full.includes("/app/api/")) continue;
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        walk(full, depth + 1);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(name)) continue;
      if (name.includes(".spec.") || name.includes(".test.")) continue;
      try {
        out[full] = readFileSync(full, "utf8");
      } catch {
        /* ignore */
      }
    }
  };
  walk(rootDir, 0);
  return out;
}
import { VenextGlobalRecoverableFallback } from "./VenextGlobalRecoverableFallback";

const workspaceRoot = join(import.meta.dirname, "../../..");

describe("Instruction 20.84-B — audit global", () => {
  it.each([
    "404 Not Found",
    "500 Internal Server Error",
    "401 Unauthorized",
    "403 Forbidden",
    "Network Error",
    "Cannot read properties of undefined",
    "unexpected token",
    "at Object.foo (",
  ])("flags technical visible: %s", (text) => {
    expect(isTechnicalErrorVisible(text)).toBe(true);
  });

  it("auditGlobalHumanizedErrorsCoverage detects raw alert", () => {
    const audit = auditGlobalHumanizedErrorsCoverage({
      "bad.tsx": 'alert(await r.text());',
    });
    expect(audit.ok).toBe(false);
    expect(audit.issues.some((i) => i.rule.includes("alert"))).toBe(true);
  });

  it("auditGlobalHumanizedErrorsCoverage passes humanized fetch", () => {
    const audit = auditGlobalHumanizedErrorsCoverage({
      "ok.tsx": 'setFeedback(humanizeCommerceErrorMessage(err));',
    });
    expect(audit.ok).toBe(true);
  });

  it("auditVisibleUiErrorPatterns detects aggressive red style", () => {
    const audit = auditVisibleUiErrorPatterns({
      "ui.tsx": 'style={{ backgroundColor: "red" }}',
    });
    expect(audit.ok).toBe(false);
  });
});

describe("Instruction 20.84-B — domain safe runtime", () => {
  it("safeWalletAction humanizes fraud wording", async () => {
    const r = await safeWalletAction(async () => {
      throw new Error("transaction rejected fraud");
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.key).toBe("wallet_action_failed");
      expect(r.error.message).not.toMatch(/fraud|rejected/i);
    }
  });

  it("safeMessagingAction humanizes network", async () => {
    const r = await safeMessagingAction(async () => {
      throw new Error("Network Error");
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.key).toBe("network_unstable");
  });

  it("safeCatalogAction returns humanized failure", async () => {
    const r = await safeCatalogAction(async () => {
      throw new Error("catalog unavailable");
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.key).toBe("catalog_unavailable");
  });

  it("safeNotificationAction", async () => {
    const r = await safeNotificationAction(async () => {
      throw new Error("sync failed");
    });
    expect(r.ok).toBe(false);
  });

  it("safeEnterpriseGovernanceAction", async () => {
    const r = await safeEnterpriseGovernanceAction(async () => {
      throw Object.assign(new Error("forbidden"), { status: 403 });
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.key).toBe("access_denied");
  });
});

describe("Instruction 20.84-B — i18n AR/ZH critical", () => {
  const keys = ["wallet_action_failed", "otp_invalid", "message_not_sent", "server_error"] as const;

  it.each(keys)("AR has copy for %s", (key) => {
    const copy = getHumanizedErrorCopy(key, "ar");
    expect(copy.message.length).toBeGreaterThan(8);
    expect(copy.message).not.toMatch(/Action indisponible/);
  });

  it.each(keys)("ZH has copy for %s", (key) => {
    const copy = getHumanizedErrorCopy(key, "zh");
    expect(copy.message.length).toBeGreaterThan(4);
    expect(copy.message).not.match(/indisponible/i);
  });
});

describe("Instruction 20.84-B — VenextGlobalRecoverableFallback", () => {
  it("renders humanized fallback", () => {
    render(<VenextGlobalRecoverableFallback error={new Error("500")} />);
    expect(screen.getByTestId("venext-global-recoverable-fallback")).toBeTruthy();
    expect(screen.getByTestId("venext-recoverable-error")).toBeTruthy();
    expect(screen.queryByText(/500/)).toBeNull();
  });
});

describe("Instruction 20.84-B — legacy app scan", () => {
  const roots = VENEXT_APP_SRC_ROOTS.map((r) => join(workspaceRoot, r)).filter((p) => existsSync(p));

  it("scans all mandated app src trees", () => {
    expect(roots.length).toBeGreaterThanOrEqual(4);
  });

  it("no raw technical patterns in production app sources", () => {
    const sources: Record<string, string> = {};
    for (const root of roots) {
      Object.assign(sources, collectAppSources(root));
    }
    const audit = auditGlobalHumanizedErrorsCoverage(sources);
    expect(
      audit.issues,
      audit.issues
        .slice(0, 15)
        .map((i) => `${i.source.split("/").slice(-2).join("/")}:${i.line ?? "?"} ${i.rule}`)
        .join("\n"),
    ).toHaveLength(0);
  });

  it("no raw technical patterns in commerce-bff and core-domain UI-facing src", () => {
    const sources: Record<string, string> = {};
    const uiFacing = /commerce-access|humanized|ForbiddenException|userMessage|access-guard|grossiste-a-pole-guard/i;
    for (const rel of VENEXT_BACKEND_SRC_ROOTS) {
      const root = join(workspaceRoot, rel);
      if (!existsSync(root)) continue;
      const all = collectAppSources(root);
      for (const [path, content] of Object.entries(all)) {
        if (uiFacing.test(path)) sources[path] = content;
      }
    }
    const audit = auditGlobalHumanizedErrorsCoverage(sources);
    expect(
      audit.issues,
      audit.issues
        .slice(0, 10)
        .map((i) => `${i.source.split("/").slice(-2).join("/")}:${i.line ?? "?"} ${i.rule}`)
        .join("\n"),
    ).toHaveLength(0);
  });

  it("no aggressive visible UI error patterns in apps", () => {
    const sources: Record<string, string> = {};
    for (const root of roots) {
      Object.assign(sources, collectAppSources(root));
    }
    const audit = auditVisibleUiErrorPatterns(sources);
    expect(audit.ok).toBe(true);
  });
});

describe("Instruction 20.84-B — app boundaries present", () => {
  const boundaryChecks: { app: string; path: string; pattern: RegExp }[] = [
    { app: "web-grossiste-a", path: "apps/web-grossiste-a/src/main.tsx", pattern: /GlobalCommerceErrorBoundary/ },
    { app: "mobile-grossiste-b", path: "apps/mobile-grossiste-b/src/main.tsx", pattern: /MobileCommerceErrorBoundary/ },
    { app: "mobile-detaillant", path: "apps/mobile-detaillant/src/main.tsx", pattern: /MobileCommerceErrorBoundary/ },
    { app: "web-industrial", path: "apps/web-industrial-nextjs/src/errors/IndustrialHumanizedErrorShell.tsx", pattern: /IndustrialCommerceErrorBoundary|CommerceErrorBoundary/ },
    { app: "backoffice", path: "apps/backoffice-web/src/errors/BackofficeHumanizedRoot.tsx", pattern: /GlobalCommerceErrorBoundary/ },
    {
      app: "industrial-messaging",
      path: "apps/web-industrial-nextjs/src/app/commerce-messaging/layout.tsx",
      pattern: /IndustrialCommerceErrorBoundary/,
    },
    {
      app: "industrial-wallet",
      path: "apps/web-industrial-nextjs/src/app/wallet/layout.tsx",
      pattern: /IndustrialCommerceErrorBoundary/,
    },
    {
      app: "industrial-poles",
      path: "apps/web-industrial-nextjs/src/app/poles/layout.tsx",
      pattern: /IndustrialCommerceErrorBoundary/,
    },
  ];

  it.each(boundaryChecks)("%s has error boundary", ({ path, pattern }) => {
    const full = join(workspaceRoot, path);
    expect(existsSync(full)).toBe(true);
    expect(readFileSync(full, "utf8")).toMatch(pattern);
  });
});

describe("Instruction 20.84-B — humanizeCaughtError", () => {
  it("never returns raw e.message for technical errors", () => {
    const msg = humanizeCaughtError(new Error("403 Forbidden"));
    expect(msg).not.toMatch(/403|Forbidden/i);
    expect(isTechnicalErrorVisible(msg)).toBe(false);
  });

  it("audit flags raw setError(e.message)", () => {
    const audit = auditGlobalHumanizedErrorsCoverage({
      "bad.tsx": "setError(e.message);",
    });
    expect(audit.ok).toBe(false);
    expect(audit.issues.some((i) => i.rule.includes("error.message"))).toBe(true);
  });
});

describe("Instruction 20.84-B — humanize matrix", () => {
  it.each([
    "authentication failed",
    "critical error",
    "payment failure",
    "fraud detected",
  ])("wallet-safe message for %s", (raw) => {
    const msg = humanizeCommerceErrorMessage(raw, { fallbackKey: "wallet_action_failed" });
    expect(msg).not.toMatch(/fraud|rejected|authentication failed|critical error/i);
    expect(isTechnicalErrorVisible(msg)).toBe(false);
  });

  it("humanizeCommerceError never exposes stack", () => {
    const h = humanizeCommerceError(new Error("TypeError at Object.foo line 1"));
    expect(h.message).not.toMatch(/TypeError|at Object/i);
  });
});
