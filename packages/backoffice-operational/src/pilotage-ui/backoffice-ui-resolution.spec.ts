import { describe, expect, it } from "vitest";

import { assertBackofficeDataResolved, normalizeBackofficeEnvelope } from "../persistence/backoffice-lightweight-envelope.js";

describe("backoffice-ui-resolution", () => {
  it.each([
    ["loading", "loading"],
    ["ready", "ready"],
    ["empty", "empty"],
    ["error", "error"],
  ] as const)("phase %s → state %s", (phase, expected) => {
    const env = normalizeBackofficeEnvelope({ payload: phase === "ready" ? [1] : [] });
    const r = assertBackofficeDataResolved(env, phase === "error" ? "error" : phase === "loading" ? "loading" : "ready");
    if (phase === "ready") expect(r.state).toBe("ready");
    else if (phase === "empty") expect(r.state).toBe("empty");
    else expect(r.state).toBe(expected);
  });

  it.each(Array.from({ length: 20 }, (_, i) => `legacy-${i}`))("legacy items batch %s", (tag) => {
    const env = normalizeBackofficeEnvelope({ items: [{ tag }] });
    expect(env.payload[0]).toEqual({ tag });
    expect(env.generatedAt).toBeTruthy();
  });

  it("fallbackUsed forces FALLBACK dataSource", () => {
    const env = normalizeBackofficeEnvelope({ payload: [], dataSource: "LIVE", fallbackUsed: true });
    expect(env.dataSource).toBe("FALLBACK");
  });

  it.each([0, 1, 5, 50, 100])("pagination total %i", (n) => {
    const env = normalizeBackofficeEnvelope({
      payload: Array.from({ length: n }, (_, i) => i),
      pagination: { total: n, page: 1, pageSize: 50, hasMore: n > 50 },
    });
    expect(env.pagination.total).toBe(n);
  });
});
