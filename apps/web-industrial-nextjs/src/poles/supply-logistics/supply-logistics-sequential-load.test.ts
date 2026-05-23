import { describe, expect, it, vi } from "vitest";
import { SUPPLY_CRITICAL, loadSupplyLogisticsSequential } from "./supply-logistics-sequential-load";

describe("supply logistics sequential fallback", () => {
  it("runs critical path before extended panels", async () => {
    const order: string[] = [];
    const fetchPanel = vi.fn(async (suffix: string) => {
      order.push(suffix);
      return { suffix };
    });
    await loadSupplyLogisticsSequential(fetchPanel);
    expect(order[0]).toBe(SUPPLY_CRITICAL[0]);
    expect(order[1]).toBe("/briefing");
    expect(fetchPanel.mock.calls.length).toBe(11);
  });
});
