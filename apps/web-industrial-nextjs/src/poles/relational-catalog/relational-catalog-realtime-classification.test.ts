import { describe, expect, it } from "vitest";

import {
  classifyRelationalCatalogStreamItem,
  RELATIONAL_CATALOG_REALTIME_CLASS_LABELS,
} from "./relational-catalog-realtime-classification";

describe("relational-catalog realtime classification", () => {
  it("classifies when pole or envelope is present", () => {
    expect(
      classifyRelationalCatalogStreamItem({
        id: "1",
        pole: "RELATIONAL_CATALOG",
        priority: "MEDIUM",
        label: "x",
        detail: "d",
        ts: new Date().toISOString(),
        relationalCatalogRealtimeClass: "DOMAIN_LIVE",
      }),
    ).toBe("DOMAIN_LIVE");
    expect(
      classifyRelationalCatalogStreamItem({
        id: "2",
        priority: "MEDIUM",
        label: "x",
        detail: "d",
        ts: new Date().toISOString(),
        relationalCatalogEnvelope: "live.relational_catalog.snapshot.refreshed",
        relationalCatalogRealtimeClass: "SYNTHETIC_TICK",
      }),
    ).toBe("SYNTHETIC_TICK");
  });

  it("labels cover all realtime classes", () => {
    expect(Object.keys(RELATIONAL_CATALOG_REALTIME_CLASS_LABELS).sort()).toEqual(
      ["DEMO_MIRROR", "DOMAIN_LIVE", "SYNTHETIC_TICK"].sort(),
    );
  });
});
