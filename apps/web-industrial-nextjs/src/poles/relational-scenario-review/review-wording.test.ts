import { describe, expect, it } from "vitest";

import aiContext from "./ai-context";

const FORBIDDEN = ["AI autopilot", "automatic decision", "smart commerce assistant", "marketplace resolution"];

describe("Instruction 20.17 — scenario review wording guard", () => {
  it("avoids forbidden autopilot phrasing in pole intel copy", () => {
    const blob = `${aiContext.summaryLine} ${aiContext.mapHintLine}`.toLowerCase();
    for (const phrase of FORBIDDEN) {
      expect(blob.includes(phrase.toLowerCase())).toBe(false);
    }
  });
});
