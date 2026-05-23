import { describe, expect, it } from "vitest";

import aiContext from "./ai-context";

const FORBIDDEN = ["ai memory", "self-learning ai", "autonomous learning", "behavior tracking"];

describe("Instruction 20.18 — strategic memory wording guard", () => {
  it("avoids forbidden opaque-learning phrasing in pole intel copy", () => {
    const blob = `${aiContext.summaryLine} ${aiContext.mapHintLine}`.toLowerCase();
    for (const phrase of FORBIDDEN) {
      expect(blob.includes(phrase)).toBe(false);
    }
  });
});
