import { describe, expect, it } from "vitest";

import {
  INDUSTRIAL_OPERATIONAL_CONTINUITY_SYMBOLIC,
  buildIndustrialOperationalContinuityCanvasGeo,
} from "./industrial-operational-continuity-canvas-adapter";

describe("industrial-operational-continuity canvas adapter", () => {
  it("exposes symbolic projection label and non-real geography", () => {
    const g = buildIndustrialOperationalContinuityCanvasGeo(null);
    expect(g.projectionLabelFr).toBe(INDUSTRIAL_OPERATIONAL_CONTINUITY_SYMBOLIC.projectionLabelFr);
    expect(g.realGeography).toBe(false);
    expect(g.advisoryOnly).toBe(true);
    expect(g.symbolicExecution).toBe(true);
  });
});
