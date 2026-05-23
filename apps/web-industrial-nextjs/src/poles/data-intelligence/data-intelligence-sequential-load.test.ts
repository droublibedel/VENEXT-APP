import { describe, expect, it, vi } from "vitest";
import { loadDataIntelligenceSequential } from "./data-intelligence-sequential-load";

describe("data intelligence sequential load", () => {
  it("fetches critical panels before extended", async () => {
    const order: string[] = [];
    const fetchPanel = vi.fn(async (suffix: string) => {
      order.push(suffix);
      return { ok: suffix };
    });
    const { partial, loadOrder } = await loadDataIntelligenceSequential(fetchPanel);
    expect(loadOrder[0]).toBe("/overview");
    expect(partial.overview).toEqual({ ok: "/overview" });
    expect(order[0]).toBe("/overview");
    expect(order.includes("/economic-score")).toBe(true);
  });
});
