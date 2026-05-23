import { describe, expect, it } from "vitest";

import {
  BCEAO_TERRAIN_SECURED_THRESHOLD_FCFA,
  parseBalanceLabelToFcfa,
} from "./adaptive-wallet-security-bridge";

describe("adaptive-wallet-security-bridge (20.78-A)", () => {
  it("parses FCFA label to integer", () => {
    expect(parseBalanceLabelToFcfa("1 240 000 FCFA")).toBe(1240000);
    expect(parseBalanceLabelToFcfa(850)).toBe(850);
  });

  it("returns 0 for empty input", () => {
    expect(parseBalanceLabelToFcfa(null)).toBe(0);
    expect(parseBalanceLabelToFcfa("")).toBe(0);
  });

  it("exposes BCEAO terrain threshold constant", () => {
    expect(BCEAO_TERRAIN_SECURED_THRESHOLD_FCFA).toBe(1000);
  });
});
