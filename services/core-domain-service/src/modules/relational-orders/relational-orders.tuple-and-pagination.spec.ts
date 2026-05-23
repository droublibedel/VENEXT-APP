import { DeliveryStatus, OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { encodeRelationalOrderCursor, parseRelationalOrderCursor } from "./relational-orders-keyset";
import {
  computeRelationalOrderStatus,
  prismaWhereForRelationalOrderStatus,
  RELATIONAL_ORDER_STATUS_PRISMA_TUPLES,
} from "./relational-orders-state.service";

describe("Instruction 20.0 — tuple index & keyset pagination", () => {
  it("every Prisma (status × delivery) pair is indexed under its relational label", () => {
    for (const s of Object.values(OrderStatus)) {
      for (const d of Object.values(DeliveryStatus)) {
        const r = computeRelationalOrderStatus(s, d);
        const tuples = RELATIONAL_ORDER_STATUS_PRISMA_TUPLES[r];
        expect(tuples.some((t) => t.status === s && t.deliveryStatus === d)).toBe(true);
      }
    }
  });

  it("prismaWhereForRelationalOrderStatus builds OR of matching tuples", () => {
    const w = prismaWhereForRelationalOrderStatus("DRAFT");
    expect(Array.isArray(w.OR)).toBe(true);
    expect(w.OR!.length).toBeGreaterThan(0);
  });

  it("EXPIRED has no Prisma mapping yet → empty id filter", () => {
    expect(prismaWhereForRelationalOrderStatus("EXPIRED")).toEqual({ id: { in: [] } });
  });

  it("keyset cursor encodes createdAt ISO + __ + orderId", () => {
    const at = new Date("2024-01-02T03:04:05.006Z");
    const id = "11111111-1111-1111-1111-111111111111";
    const cur = encodeRelationalOrderCursor(at, id);
    expect(cur).toContain("__");
    expect(parseRelationalOrderCursor(cur)).toEqual({ at, id });
  });
});
