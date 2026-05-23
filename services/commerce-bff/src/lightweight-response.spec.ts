import { describe, expect, it } from "vitest";

import { shapeBffEnvelope, trimBffArray } from "./lightweight-response.js";

describe("lightweight-response (20.85)", () => {
  it("trimBffArray under cap", () => {
    const r = trimBffArray([1, 2, 3], 10);
    expect(r.trimmed).toBe(false);
    expect(r.payload).toEqual([1, 2, 3]);
  });

  it("trimBffArray over cap", () => {
    const r = trimBffArray(Array.from({ length: 60 }, (_, i) => i), 50);
    expect(r.trimmed).toBe(true);
    expect(r.payload).toHaveLength(50);
  });

  it("shapeBffEnvelope marks trimmed", () => {
    const env = shapeBffEnvelope(Array.from({ length: 10 }, (_, i) => i), "live", { maxItems: 5 });
    expect(env.trimmed).toBe(true);
    expect(env.itemCount).toBe(5);
  });

  it("shapeBffEnvelope fallback", () => {
    const env = shapeBffEnvelope({ ok: true }, "fallback", { fallbackUsed: true });
    expect(env.fallbackUsed).toBe(true);
  });
});
