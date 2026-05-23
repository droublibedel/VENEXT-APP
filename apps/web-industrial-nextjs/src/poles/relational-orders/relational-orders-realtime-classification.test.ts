import { describe, expect, it } from "vitest";

import type { OperationalSignalItem } from "../types";

import {
  classifyRelationalOrdersStreamItem,
  RELATIONAL_ORDERS_REALTIME_CLASS_LABELS,
} from "./relational-orders-realtime-classification";

describe("relational-orders realtime classification", () => {
  it("classifies pole RELATIONAL_ORDERS rows", () => {
    const ev = {
      id: "1",
      pole: "RELATIONAL_ORDERS",
      priority: "MEDIUM",
      label: "x",
      detail: "d",
      ts: new Date().toISOString(),
      relationalOrdersRealtimeClass: "DOMAIN_LIVE" as const,
    } satisfies OperationalSignalItem;
    expect(classifyRelationalOrdersStreamItem(ev)).toBe("DOMAIN_LIVE");
  });

  it("labels cover all realtime class enum keys", () => {
    expect(Object.keys(RELATIONAL_ORDERS_REALTIME_CLASS_LABELS).sort()).toEqual(
      ["DEMO_MIRROR", "DOMAIN_LIVE", "SYNTHETIC_TICK"].sort(),
    );
  });
});
