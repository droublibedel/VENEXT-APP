import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  RelationalOrderSignalSchema,
  RelationalOrdersResponseSchema,
} from "@venext/shared-contracts";

import { makeTestRelationalOrderDiagnostics } from "./relational-order-diagnostics.fixture";
import { resolveOrderRelationshipIds } from "./relational-orders-access.service";

describe("Instruction 20.0 — relational orders contracts", () => {
  it("parses ACTIVE snapshot envelope", () => {
    const oid = "71111111-1111-1111-1111-111111111101";
    const rid = "82222222-2222-2222-2222-222222222202";
    const parsed = RelationalOrdersResponseSchema.safeParse({
      policy: "ACTIVE",
      snapshot: {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId: oid,
        viewerRole: "RETAILER",
        orders: [
          {
            version: "1",
            generatedAt: new Date().toISOString(),
            organizationId: oid,
            orderId: "93333333-3333-3333-3333-333333333303",
            orderNumber: "ORD-933333333303",
            orderType: "DIRECT_RELATIONAL_ORDER",
            orderStatus: "PENDING_CONFIRMATION",
            relationshipId: rid,
            upstreamOrganizationId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            downstreamOrganizationId: oid,
            buyerRole: "RETAILER",
            sellerRole: "WHOLESALER",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expectedPreparationWindow: null,
            symbolicFulfillmentState: "NOT_STARTED",
            negotiationAttached: false,
            reservationOrigin: null,
            groupedOrderOrigin: null,
            advisoryOnly: true,
            symbolicExecution: true,
            heuristicSignals: [],
            orderLines: [
              {
                productId: "11111111-1111-1111-1111-111111111111",
                catalogId: "22222222-2222-2222-2222-222222222222",
                quantity: 2,
                symbolicAvailability: "ACTIVE_PRODUCT_ROW",
                negotiated: false,
                reserved: false,
                lineSignals: [],
                advisoryOnly: true,
                symbolicStock: "UNKNOWN",
                explanation: "corridor line",
              },
            ],
            visibilityBoundary: "RELATIONSHIP_SCOPED_ORDER_READ",
            relationshipScopeMode: "RETAILER_SUPPLIER_ONLY",
          },
        ],
        diagnostics: makeTestRelationalOrderDiagnostics(),
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("relational order signal enforces advisory / heuristic / symbolic literals", () => {
    const s = RelationalOrderSignalSchema.safeParse({
      signalId: "x",
      signalType: "ORDER_CONCENTRATION_RISK",
      severity: "low",
      confidence: 0.5,
      confidenceExplanation: "c",
      heuristicOnly: true,
      advisoryOnly: true,
      symbolicExecution: true,
      explanation: "e",
      sourceSignals: ["a"],
    });
    expect(s.success).toBe(true);
  });

  it("producer resolves only downstream relationship id", () => {
    const p = "11111111-1111-1111-1111-111111111101";
    const edges = [
      { relationshipId: "aa", upstreamOrganizationId: p, downstreamOrganizationId: "w" },
      { relationshipId: "bb", upstreamOrganizationId: "w", downstreamOrganizationId: "r" },
    ];
    expect(resolveOrderRelationshipIds("PRODUCER", p, edges)).toEqual(["aa"]);
  });

  it("admin viewer on incident org collects both adjacent relationship ids", () => {
    const w = "22222222-2222-2222-2222-222222222202";
    const edges = [
      { relationshipId: "r1", upstreamOrganizationId: "p", downstreamOrganizationId: w },
      { relationshipId: "r2", upstreamOrganizationId: w, downstreamOrganizationId: "r" },
    ];
    expect(resolveOrderRelationshipIds("ADMIN_VIEWER", w, edges).sort()).toEqual(["r1", "r2"].sort());
  });

  it("wholesaler resolves incident relationship ids on both corridor sides", () => {
    const w = "22222222-2222-2222-2222-222222222202";
    const edges = [
      { relationshipId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", upstreamOrganizationId: "p", downstreamOrganizationId: w },
      { relationshipId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", upstreamOrganizationId: w, downstreamOrganizationId: "r" },
    ];
    const ids = resolveOrderRelationshipIds("WHOLESALER", w, edges).sort();
    expect(ids).toEqual(["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"].sort());
  });

  it("retailer resolves only upstream relationship id", () => {
    const r = "33333333-3333-3333-3333-333333333303";
    const edges = [
      { relationshipId: "aa", upstreamOrganizationId: "w", downstreamOrganizationId: r },
      { relationshipId: "bb", upstreamOrganizationId: "w", downstreamOrganizationId: "x" },
    ];
    expect(resolveOrderRelationshipIds("RETAILER", r, edges)).toEqual(["aa"]);
  });

  it("wording guard: access service avoids forbidden commerce hype tokens", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(resolve(here, "relational-orders-access.service.ts"), "utf8");
    expect(src.toLowerCase()).not.toContain("buy now");
    expect(src.toLowerCase()).not.toContain("marketplace feed");
  });
});
