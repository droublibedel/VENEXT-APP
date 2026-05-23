import { describe, expect, it } from "vitest";

import { ORDER_ADV_REALTIME_EVENT_TYPES } from "./realtime-contract";

describe("Instruction 14 — order ADV realtime contract", () => {
  it("defines five demo and five live envelope types", () => {
    expect(ORDER_ADV_REALTIME_EVENT_TYPES).toHaveLength(10);
    expect(ORDER_ADV_REALTIME_EVENT_TYPES.filter((t) => t.startsWith("demo."))).toHaveLength(5);
    expect(ORDER_ADV_REALTIME_EVENT_TYPES.filter((t) => t.startsWith("live."))).toHaveLength(5);
  });
});
