import { describe, expect, it } from "vitest";

import {
  assertNoRealtimeNamespaceCollision,
  findRelationalRealtimeNamespaceByEventType,
  RELATIONAL_LEVEL_5_REALTIME_NAMESPACES,
} from "./shared-relational-realtime-namespace.registry.js";

describe("shared-relational-realtime-namespace.registry", () => {
  it("assertNoRealtimeNamespaceCollision passes", () => {
    expect(() => assertNoRealtimeNamespaceCollision()).not.toThrow();
  });

  it("finds namespace by event type", () => {
    const entry = findRelationalRealtimeNamespaceByEventType(
      "relational.macro_observatory_governance.matrix_generated",
    );
    expect(entry?.instruction).toBe("20.43");
  });

  it("has 16 level-5 entries", () => {
    expect(RELATIONAL_LEVEL_5_REALTIME_NAMESPACES).toHaveLength(16);
  });
});
