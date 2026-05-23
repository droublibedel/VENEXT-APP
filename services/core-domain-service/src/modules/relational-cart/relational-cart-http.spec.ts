import { describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";

import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { RelationalCartController } from "./relational-cart.controller";

describe("Instruction 20.6A — RelationalCartController GET :cartId", () => {
  it("delegates to service.getCart with actor organization", async () => {
    const getCart = vi.fn().mockResolvedValue({ cart: {}, diagnostics: {} });
    const c = new RelationalCartController({ getCart } as never, {} as never);
    const req = {
      [VENEXT_COMMERCE_THREAD_ACTOR_KEY]: { userId: "u1", organizationId: "550e8400-e29b-41d4-a716-446655440002" },
    };
    await c.getOne("550e8400-e29b-41d4-a716-446655440001", req as never);
    expect(getCart).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002");
  });

  it("propagates NotFoundException from service", async () => {
    const getCart = vi.fn().mockRejectedValue(new NotFoundException("missing"));
    const c = new RelationalCartController({ getCart } as never, {} as never);
    const req = {
      [VENEXT_COMMERCE_THREAD_ACTOR_KEY]: { userId: "u1", organizationId: "550e8400-e29b-41d4-a716-446655440002" },
    };
    await expect(c.getOne("550e8400-e29b-41d4-a716-446655440001", req as never)).rejects.toBeInstanceOf(NotFoundException);
  });
});
