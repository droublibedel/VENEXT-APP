import { describe, expect, it } from "vitest";

import {
  INDUSTRIAL_SITUATION_ROOM_SYMBOLIC,
  buildIndustrialSituationRoomCanvasGeo,
} from "./industrial-situation-room-canvas-adapter";

describe("industrial-situation-room canvas adapter", () => {
  it("exposes symbolic projection label and non-real geography", () => {
    const g = buildIndustrialSituationRoomCanvasGeo(null);
    expect(g.projectionLabelFr).toBe(INDUSTRIAL_SITUATION_ROOM_SYMBOLIC.projectionLabelFr);
    expect(g.realGeography).toBe(false);
    expect(g.advisoryOnly).toBe(true);
    expect(g.symbolicExecution).toBe(true);
  });
});
