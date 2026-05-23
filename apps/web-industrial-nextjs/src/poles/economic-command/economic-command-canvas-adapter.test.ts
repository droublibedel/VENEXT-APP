import { describe, expect, it } from "vitest";

import {
  ECONOMIC_COMMAND_SYMBOLIC_PROJECTION,
  buildEconomicCommandCanvasGeo,
} from "./economic-command-canvas-adapter";

describe("economic-command canvas adapter", () => {
  it("exposes symbolic projection label and non-real geography", () => {
    const g = buildEconomicCommandCanvasGeo(null);
    expect(g.projectionLabelFr).toBe(ECONOMIC_COMMAND_SYMBOLIC_PROJECTION.projectionLabelFr);
    expect(g.realGeography).toBe(false);
    expect(g.advisoryOnly).toBe(true);
  });
});
