import { describe, expect, it } from "vitest";

import {
  assertBackofficeDataResolved,
  envelopeFromArray,
  normalizeBackofficeEnvelope,
} from "../persistence/backoffice-lightweight-envelope.js";
import { paginate } from "../persistence/lightweight-envelope.js";

describe("backoffice-envelope-normalization", () => {
  it.each(["items", "payload", "rows", "records"] as const)("maps %s to payload", (key) => {
    const env = normalizeBackofficeEnvelope({ [key]: [{ id: "1" }] });
    expect(env.payload).toHaveLength(1);
    expect((env.payload[0] as { id: string }).id).toBe("1");
  });

  it("maps data array to payload", () => {
    const env = normalizeBackofficeEnvelope({ data: [{ x: 1 }] });
    expect(env.payload).toHaveLength(1);
  });

  it("sets generatedAt", () => {
    const env = normalizeBackofficeEnvelope({ payload: [] });
    expect(env.generatedAt).toBeTruthy();
  });

  it.each(["live", "fallback", "mixed", "LIVE", "FALLBACK"] as const)("normalizes dataSource %s", (ds) => {
    const env = normalizeBackofficeEnvelope({ payload: [], dataSource: ds });
    expect(["LIVE", "FALLBACK", "MIXED"]).toContain(env.dataSource);
  });

  it("envelopeFromArray paginates", () => {
    const env = envelopeFromArray([1, 2, 3]);
    expect(env.payload).toEqual([1, 2, 3]);
    expect(env.pagination.total).toBe(3);
  });

  it("assertBackofficeDataResolved empty", () => {
    const r = assertBackofficeDataResolved(normalizeBackofficeEnvelope({ payload: [] }));
    expect(r.state).toBe("empty");
  });

  it("assertBackofficeDataResolved ready", () => {
    const r = assertBackofficeDataResolved(normalizeBackofficeEnvelope({ payload: [1] }));
    expect(r.state).toBe("ready");
  });

  it("assertBackofficeDataResolved loading", () => {
    const r = assertBackofficeDataResolved(null, "loading");
    expect(r.state).toBe("loading");
  });

  it.each(Array.from({ length: 15 }, (_, i) => i))("batch normalize %i", (i) => {
    const env = normalizeBackofficeEnvelope({ items: Array.from({ length: i }, (_, j) => j) });
    expect(env.payload.length).toBe(i);
  });

  it("prefers payload over items", () => {
    const env = normalizeBackofficeEnvelope({ payload: ["a"], items: ["b"] });
    expect(env.payload[0]).toBe("a");
  });

  it("paginate integration", () => {
    const p = paginate([1, 2, 3, 4, 5], 1, 2);
    const env = normalizeBackofficeEnvelope({ payload: p.items, pagination: p });
    expect(env.pagination.hasMore).toBe(true);
  });
});
