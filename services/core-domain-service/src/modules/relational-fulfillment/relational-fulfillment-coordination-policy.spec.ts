import { describe, expect, it } from "vitest";
import { BadRequestException } from "@nestjs/common";

import { RelationalFulfillmentCoordinationPolicyService } from "./relational-fulfillment-coordination-policy.service";

describe("Instruction 20.11 — fulfillment task policy", () => {
  const p = new RelationalFulfillmentCoordinationPolicyService();

  it("forbids COMPLETED -> IN_PROGRESS without reopen", () => {
    expect(() => p.assertTaskStatusTransitionAllowed("COMPLETED", "IN_PROGRESS")).toThrow(BadRequestException);
  });

  it("allows BLOCKED -> OPEN via reopen", () => {
    expect(() => p.assertTaskStatusTransitionAllowed("BLOCKED", "OPEN", { reopen: true })).not.toThrow();
  });

  it("allows OPEN -> IN_PROGRESS", () => {
    expect(() => p.assertTaskStatusTransitionAllowed("OPEN", "IN_PROGRESS")).not.toThrow();
  });

  it("forbids forbidden transition PREPARING analog OPEN -> COMPLETED if not in graph", () => {
    expect(() => p.assertTaskStatusTransitionAllowed("OPEN", "COMPLETED")).toThrow(BadRequestException);
  });

  it("assertConfirmationsSatisfied requires buyer confirmation", () => {
    expect(() =>
      p.assertConfirmationsSatisfied({
        requiresBuyerConfirmation: true,
        requiresSellerConfirmation: false,
        buyerConfirmedAt: null,
        sellerConfirmedAt: null,
      }),
    ).toThrow(BadRequestException);
  });
});
