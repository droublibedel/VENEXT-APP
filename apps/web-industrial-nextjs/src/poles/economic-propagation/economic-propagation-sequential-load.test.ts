import { describe, expect, it, vi } from "vitest";

import { loadEconomicPropagationSequential } from "./economic-propagation-sequential-load";

describe("economic-propagation sequential load", () => {
  it("falls back in documented order", async () => {
    const order: string[] = [];
    const fetchPanel = vi.fn(async (suffix: string) => {
      order.push(suffix);
      return { suffix };
    });
    const { partial, loadOrder } = await loadEconomicPropagationSequential(fetchPanel);
    expect(loadOrder[0]).toBe("/overview");
    expect(partial.overview).toEqual({ suffix: "/overview" });
    expect(order.length).toBeGreaterThanOrEqual(5);
  });
});
