import { describe, expect, it } from "vitest";

import { ECONOMIC_MEMORY_SEQUENTIAL_LOAD_STEPS } from "./economic-memory-sequential-load";

describe("economic-memory sequential load contract", () => {
  it("declares bundle before history", () => {
    expect(ECONOMIC_MEMORY_SEQUENTIAL_LOAD_STEPS[0]).toContain("bundle");
    expect(ECONOMIC_MEMORY_SEQUENTIAL_LOAD_STEPS[1]).toContain("history");
  });
});
