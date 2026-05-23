import { describe, expect, it } from "vitest";
import { FINANCE_CRITICAL, FINANCE_EXTENDED, loadFinanceCollectionsSequential } from "./finance-collections-sequential-load";

describe("finance collections sequential fallback sequencing", () => {
  it("loads critical panels before extended", async () => {
    const order: string[] = [];
    const fetchPanel = async (suffix: string) => {
      order.push(suffix);
      return { suffix };
    };
    const { loadOrder } = await loadFinanceCollectionsSequential(fetchPanel);
    expect(loadOrder[0]).toBe(FINANCE_CRITICAL[0]);
    const lastCritical = FINANCE_CRITICAL[FINANCE_CRITICAL.length - 1]!;
    const firstExtended = FINANCE_EXTENDED[0]!;
    expect(loadOrder.indexOf(lastCritical)).toBeLessThan(loadOrder.indexOf(firstExtended));
  });
});
