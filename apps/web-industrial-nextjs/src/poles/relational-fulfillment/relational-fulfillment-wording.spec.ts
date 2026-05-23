import { describe, expect, it } from "vitest";

import { fulfillmentStatusHeadline } from "./relational-fulfillment-copy";

describe("Instruction 20.9 — fulfillment wording guard", () => {
  it("uses corridor reception vocabulary not consumer tracking", () => {
    const s = fulfillmentStatusHeadline("RECEPTION_VALIDATED");
    expect(s.toLowerCase()).not.toContain("tracking");
    expect(s.toLowerCase()).not.toContain("checkout");
    expect(s.toLowerCase()).not.toContain("parcel");
    expect(s).toContain("Réception");
  });

  it("partial validation copy", () => {
    expect(fulfillmentStatusHeadline("RECEPTION_PARTIALLY_VALIDATED")).toContain("partielle");
  });
});
