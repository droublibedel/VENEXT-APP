import { describe, expect, it } from "vitest";

import { decodePersistedScenarioCursor, encodePersistedScenarioCursor } from "./economic-scenarios-persisted-cursor";

describe("economic-scenarios persisted cursor", () => {
  it("round-trips createdAt and id", () => {
    const createdAt = new Date("2026-02-01T12:34:56.789Z");
    const id = "clxyz123";
    const c = encodePersistedScenarioCursor({ createdAt, id });
    const d = decodePersistedScenarioCursor(c);
    expect(d.id).toBe(id);
    expect(d.createdAt.toISOString()).toBe(createdAt.toISOString());
  });

  it("rejects invalid cursor", () => {
    expect(() => decodePersistedScenarioCursor("not-valid")).toThrow();
  });
});
