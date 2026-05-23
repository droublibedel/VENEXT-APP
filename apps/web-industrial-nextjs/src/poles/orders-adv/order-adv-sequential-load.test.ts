import { describe, expect, it, vi } from "vitest";
import { loadOrderAdvSequential } from "./order-adv-sequential-load";

describe("order-adv sequential fallback", () => {
  it("loads critical panels before extended (no parallel 11-way burst)", async () => {
    const order: string[] = [];
    const fetchPanel = vi.fn(async (suffix: string) => {
      order.push(suffix);
      return { suffix };
    });
    await loadOrderAdvSequential(fetchPanel);
    expect(order[0]).toBe("/overview");
    expect(order[1]).toBe("/briefing");
    expect(order[2]).toBe("/risk-matrix");
    expect(order[3]).toBe("/interventions");
    expect(order[4]).toBe("/conversational-commerce");
    expect(fetchPanel.mock.calls.length).toBe(11);
  });
});
