import { describe, expect, it } from "vitest";

import { sanitizeLivePayload, sanitizeTechnicalMessage } from "./backoffice-live-observability-sanitizer.js";

const SENSITIVE_KEYS = [
  "password",
  "otp",
  "token",
  "secret",
  "authorization",
  "cookie",
  "session",
  "apiKey",
  "cardNumber",
  "iban",
  "cvv",
  "pin",
  "stackTrace",
];

describe("backoffice-live-sanitizer", () => {
  it.each(SENSITIVE_KEYS)("redacts key %s", (key) => {
    const out = sanitizeLivePayload({ [key]: "leak", safe: "ok" });
    expect(out[key]).toBe("[redacted]");
    expect(out.safe).toBe("ok");
  });

  it.each([
    "123456",
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsW8",
  ])("redacts sensitive string pattern %s", (value) => {
    expect(sanitizeLivePayload({ note: value }).note).toBe("[redacted]");
  });

  it("truncates long strings", () => {
    const long = "a".repeat(5000);
    const out = sanitizeLivePayload({ msg: long });
    expect(String(out.msg).length).toBeLessThanOrEqual(2000);
  });

  it("sanitizes nested objects", () => {
    const out = sanitizeLivePayload({ nested: { password: "x", ok: 1 } });
    expect((out.nested as Record<string, unknown>).password).toBe("[redacted]");
  });

  it("limits array size", () => {
    const out = sanitizeLivePayload({ items: Array.from({ length: 50 }, (_, i) => i) });
    expect((out.items as unknown[]).length).toBe(20);
  });

  it("strips stack frames from technical messages", () => {
    const m = sanitizeTechnicalMessage("Error at src/foo.tsx:42");
    expect(m).toContain("[stack-redacted]");
    expect(m).not.toContain("foo.tsx:42");
  });

  it.each(["", "ok message"])("passes safe technical %s", (msg) => {
    expect(sanitizeTechnicalMessage(msg)).toBe(msg);
  });
});
