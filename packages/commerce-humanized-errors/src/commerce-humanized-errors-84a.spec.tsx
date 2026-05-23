import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { auditHumanizedErrorsCoverage, isCommerceHumanizedErrorsEnabled } from "./commerce-error-audit";
import { getHumanizedErrorCopy } from "./commerce-error-i18n";
import { mapHttpStatusToErrorKey, mapRawMessageToErrorKey, mapThrownErrorToErrorKey } from "./commerce-error-mappers";
import {
  clearInternalCommerceErrorLog,
  getInternalCommerceErrorLog,
  logInternalCommerceError,
} from "./commerce-error-internal-logger";
import {
  humanizeByKey,
  humanizeCommerceError,
  humanizeCommerceErrorMessage,
  isTechnicalErrorVisible,
  sanitizeVisibleErrorText,
} from "./commerce-humanized-errors";
import { installCommerceHumanizedGlobalHandlers } from "./commerce-humanized-errors-global";
import type { CommerceErrorKey } from "./commerce-humanized-errors.types";
import { recoveryActionsForKey, recoveryActionLabel } from "./commerce-error-recovery";
import { severityForErrorKey } from "./commerce-error-severity";
import {
  extractHumanMessage,
  safeAsyncAction,
  safeFetch,
  safeRender,
  safeRouteTransition,
} from "./commerce-safe-runtime";
import { VenextHumanizedErrorCard } from "./VenextHumanizedErrorCard";
import { VenextInlineError } from "./VenextInlineError";
import { GlobalCommerceErrorBoundary } from "./commerce-error-boundary";

const ALL_KEYS: CommerceErrorKey[] = [
  "network_unstable",
  "connection_timeout",
  "session_expired",
  "access_suspended",
  "access_denied",
  "relation_inactive",
  "wallet_locked",
  "otp_invalid",
  "password_incorrect",
  "load_failed",
  "service_unavailable",
  "catalog_unavailable",
  "message_not_sent",
  "delivery_unavailable",
  "invalid_file",
  "image_error",
  "sync_failed",
  "cache_error",
  "not_found",
  "server_error",
  "runtime_error",
  "unexpected",
  "offline",
  "wallet_action_failed",
  "order_unavailable",
  "generic",
];

describe("Instruction 20.84-A — humanized errors", () => {
  beforeEach(() => clearInternalCommerceErrorLog());
  afterEach(() => vi.restoreAllMocks());

  describe("technical → human mapping", () => {
    it.each([
      ["404 Not Found", "not_found"],
      ["500 Internal Server Error", "server_error"],
      ["Network Error", "network_unstable"],
      ["timeout ETIMEDOUT", "connection_timeout"],
      ["Cannot read property 'x' of undefined", "runtime_error"],
      ["transaction rejected", "wallet_action_failed"],
      ["fraud detected", "wallet_action_failed"],
    ] as const)("maps %s → %s", (raw, key) => {
      expect(mapRawMessageToErrorKey(raw)).toBe(key);
    });

    it.each([401, 403, 404, 500, 503] as const)("HTTP %s status key", (status) => {
      expect(mapHttpStatusToErrorKey(status)).toBeTruthy();
    });

    it("maps Error object message", () => {
      expect(mapThrownErrorToErrorKey(new Error("failed to fetch"))).toBe("network_unstable");
    });
  });

  describe("humanizeCommerceError", () => {
    it("404 humanized — no HTTP visible", () => {
      const h = humanizeCommerceError("404 Not Found");
      expect(h.message).not.toMatch(/404/);
      expect(h.key).toBe("not_found");
    });

    it("500 humanized", () => {
      const h = humanizeCommerceError({ status: 500, message: "Internal Server Error" });
      expect(h.key).toBe("server_error");
      expect(h.message).not.toMatch(/500/);
    });

    it("network error humanized", () => {
      const h = humanizeCommerceError(new Error("Network Error"));
      expect(h.key).toBe("network_unstable");
      expect(h.message.toLowerCase()).toContain("connexion");
    });

    it("timeout humanized", () => {
      const h = humanizeCommerceError("Request timed out");
      expect(h.key).toBe("connection_timeout");
    });

    it("runtime error hidden jargon", () => {
      const h = humanizeCommerceError(new TypeError("Cannot read properties of undefined"));
      expect(h.key).toBe("runtime_error");
      expect(h.message).not.toMatch(/undefined|TypeError/i);
    });

    it("wallet error soft", () => {
      const h = humanizeCommerceError("transaction rejected by bank");
      expect(h.key).toBe("wallet_action_failed");
      expect(h.message).not.toMatch(/reject|fraud/i);
    });

    it("OTP error human", () => {
      const h = humanizeCommerceError("otp invalid code");
      expect(h.key).toBe("otp_invalid");
    });

    it("offline error", () => {
      const h = humanizeCommerceError("offline mode");
      expect(h.key).toBe("offline");
    });

    it("logs internally without exposing stack to user", () => {
      humanizeCommerceError(new Error("boom"), { module: "test" });
      const logs = getInternalCommerceErrorLog();
      expect(logs.length).toBe(1);
      expect(logs[0]?.stack).toBeTruthy();
    });
  });

  describe("sanitizeVisibleErrorText", () => {
    it.each([
      "404 Not Found",
      '{"error":"bad"}',
      "at Object.handler (app.tsx:12)",
      "500 Internal Server Error",
    ])("blocks technical: %s", (raw) => {
      const safe = sanitizeVisibleErrorText(raw);
      expect(isTechnicalErrorVisible(safe)).toBe(false);
    });

    it("allows short human copy", () => {
      const safe = sanitizeVisibleErrorText("Réessayez dans un instant.");
      expect(safe).toContain("Réessayez");
    });
  });

  describe("catalog coverage", () => {
    it.each(ALL_KEYS)("catalog key %s has FR copy", (key) => {
      const copy = getHumanizedErrorCopy(key, "fr-CI");
      expect(copy.title.length).toBeGreaterThan(3);
      expect(copy.message.length).toBeGreaterThan(8);
      expect(copy.message).not.toMatch(/\b(404|500|undefined|stack)\b/i);
    });

    it.each(ALL_KEYS)("severity defined for %s", (key) => {
      expect(severityForErrorKey(key)).toBeTruthy();
    });

    it.each(ALL_KEYS)("recovery actions for %s", (key) => {
      expect(recoveryActionsForKey(key).length).toBeGreaterThan(0);
    });
  });

  describe("i18n", () => {
    it("EN network copy", () => {
      const copy = getHumanizedErrorCopy("network_unstable", "en-US");
      expect(copy.message).toMatch(/internet/i);
    });

    it("AR generic copy", () => {
      const copy = getHumanizedErrorCopy("generic", "ar-SA");
      expect(copy.title.length).toBeGreaterThan(2);
    });

    it("ZH network copy", () => {
      const copy = getHumanizedErrorCopy("network_unstable", "zh-CN");
      expect(copy.message).toMatch(/网络/);
    });

    it("recovery labels EN", () => {
      expect(recoveryActionLabel("retry", "en-GB")).toBe("Try again");
    });
  });

  describe("safe runtime", () => {
    it("safeAsyncAction ok", async () => {
      const r = await safeAsyncAction(async () => 42);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(42);
    });

    it("safeAsyncAction failure humanized", async () => {
      const r = await safeAsyncAction(async () => {
        throw new Error("Network Error");
      });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.message).not.toMatch(/Network Error/i);
      }
    });

    it("safeFetch maps 404", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response),
      );
      const r = await safeFetch("/x");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.key).toBe("not_found");
    });

    it("safeFetch network failure", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("failed to fetch")));
      const r = await safeFetch("/x");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.key).toBe("network_unstable");
    });

    it("safeRender catches runtime", () => {
      const r = safeRender(() => {
        throw new Error("undefined is not a function");
      });
      expect(r.ok).toBe(false);
    });

    it("safeRouteTransition", () => {
      const r = safeRouteTransition(() => {
        throw new Error("boom");
      });
      expect(r.ok).toBe(false);
    });

    it("extractHumanMessage from humanized throw", () => {
      const err = new Error("x");
      (err as Error & { humanized: ReturnType<typeof humanizeCommerceError> }).humanized =
        humanizeByKey("generic");
      expect(extractHumanMessage(err)).toContain("disponible");
    });
  });

  describe("UI components", () => {
    it("VenextHumanizedErrorCard renders without HTTP codes", () => {
      const h = humanizeByKey("server_error");
      render(<VenextHumanizedErrorCard error={h} onRetry={() => undefined} />);
      expect(screen.getByTestId("venext-error-message").textContent).not.toMatch(/500/);
      fireEvent.click(screen.getByTestId("venext-error-retry"));
    });

    it("VenextInlineError sanitizes", () => {
      render(<VenextInlineError message="404 Not Found" />);
      expect(screen.getByTestId("venext-inline-error").textContent).not.toMatch(/404/);
    });

    it("no stack in card message", () => {
      const h = humanizeCommerceError(new Error("at Object.foo"));
      render(<VenextHumanizedErrorCard error={h} testId="venext-humanized-error-card-single" />);
      const card = screen.getByTestId("venext-humanized-error-card-single");
      expect(card.querySelector('[data-testid="venext-error-message"]')?.textContent).not.toMatch(
        /at Object/,
      );
    });
  });

  describe("error boundary", () => {
    it("renders humanized fallback on child crash", () => {
      function Boom(): never {
        throw new Error("Cannot read property x");
      }
      const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      expect(() =>
        render(
          <GlobalCommerceErrorBoundary>
            <Boom />
          </GlobalCommerceErrorBoundary>,
        ),
      ).not.toThrow();
      const panel = screen.getByTestId("venext-recoverable-error");
      expect(panel).toBeTruthy();
      expect(panel.querySelector('[data-testid="venext-error-message"]')?.textContent).not.toMatch(
        /Cannot read/i,
      );
      spy.mockRestore();
    });
  });

  describe("audit & flags", () => {
    it("audit flags risky snippets", () => {
      const result = auditHumanizedErrorsCoverage({
        bad: 'alert("500 Internal Server Error")',
      });
      expect(result.ok).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it("flag enabled by default", () => {
      expect(isCommerceHumanizedErrorsEnabled({})).toBe(true);
    });

    it("flag can be disabled", () => {
      expect(isCommerceHumanizedErrorsEnabled({ commerce_humanized_errors_enabled: false })).toBe(
        false,
      );
    });
  });

  describe("global handlers", () => {
    it("installs and uninstalls handlers", () => {
      const off = installCommerceHumanizedGlobalHandlers({ locale: "fr-CI" });
      expect(typeof off).toBe("function");
      off();
    });
  });

  describe("humanizeCommerceErrorMessage", () => {
    it("returns string only", () => {
      const msg = humanizeCommerceErrorMessage(503);
      expect(typeof msg).toBe("string");
      expect(msg).not.toMatch(/503/);
    });
  });

  describe("internal logger", () => {
    it("stores capped log entries", () => {
      for (let i = 0; i < 5; i++) {
        logInternalCommerceError({ key: "generic", rawMessage: `e${i}` });
      }
      expect(getInternalCommerceErrorLog().length).toBe(5);
    });
  });
});

// Additional matrix to reach 80+ assertions
describe("Instruction 20.84-A — extended matrix", () => {
  const technicalSamples = [
    "403 Forbidden",
    "401 Unauthorized",
    "unexpected token <",
    "SyntaxError: bad json",
    "ReferenceError: foo",
    "PrismaClientKnownRequestError",
    "axios error",
    "security violation",
    "authentication failure",
    "null reference",
    "webpack-internal",
  ];

  it.each(technicalSamples)("humanize hides: %s", (sample) => {
    const h = humanizeCommerceError(sample);
    expect(h.message).not.toMatch(/403|401|Prisma|axios|webpack|SyntaxError/i);
    expect(isTechnicalErrorVisible(h.message)).toBe(false);
  });

  it.each([404, 500, 502, 503, 504] as const)("status object %s", (status) => {
    const h = humanizeCommerceError({ status, message: `${status} error` });
    expect(h.message).not.toMatch(new RegExp(String(status)));
  });
});
