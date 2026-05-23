import { describe, expect, it } from "vitest";

import {
  relationExecutionEventHeadline,
  relationExecutionStatusHeadline,
  relationOrderRealtimeEnvelopeLabel,
} from "./relational-order-execution-copy";

describe("Instruction 20.8A — relational order execution wording", () => {
  it("distinguishes cancelled vs blocked for status", () => {
    expect(relationExecutionStatusHeadline("CANCELLED")).toBe("Exécution annulée");
    expect(relationExecutionStatusHeadline("BLOCKED")).toBe("Exécution bloquée");
    expect(relationExecutionStatusHeadline("CANCELLED")).not.toContain("bloqu");
  });

  it("distinguishes cancelled vs blocked for persisted event types", () => {
    expect(relationExecutionEventHeadline("EXECUTION_CANCELLED")).toBe("Exécution annulée");
    expect(relationExecutionEventHeadline("EXECUTION_BLOCKED")).toBe("Exécution bloquée");
  });

  it("partial fulfillment status copy", () => {
    expect(relationExecutionStatusHeadline("PARTIALLY_FULFILLED")).toContain("partielle");
  });

  it("realtime envelope summaries avoid public-tracking vocabulary", () => {
    const s = relationOrderRealtimeEnvelopeLabel("relational.order.cancelled");
    expect(s.toLowerCase()).not.toContain("tracking");
    expect(s.toLowerCase()).not.toContain("checkout");
  });
});
