import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RelationalOrdersResponse } from "@venext/shared-contracts";

import { makeTestRelationalOrderDiagnostics } from "./relational-order-diagnostics.fixture";
import { RelationalOrdersWorkspace } from "./RelationalOrdersWorkspace";

afterEach(() => {
  cleanup();
});

function minimalResponse(over: Partial<RelationalOrdersResponse["snapshot"]> = {}): RelationalOrdersResponse {
  const diagnostics = makeTestRelationalOrderDiagnostics({
    nextOrderCursor: "2024-01-01T00:00:00.000Z__00000000-0000-4000-8000-000000000001",
    ordersTruncated: true,
  });
  return {
    policy: "ACTIVE",
    snapshot: {
      version: "1",
      generatedAt: new Date().toISOString(),
      organizationId: "00000000-0000-4000-8000-000000000099",
      viewerRole: "RETAILER",
      orders: [],
      diagnostics,
      ...over,
    },
  };
}

describe("RelationalOrdersWorkspace", () => {
  it("shows pagination diagnostics and load-next when cursor present", () => {
    const loadNextPage = vi.fn();
    render(
      <RelationalOrdersWorkspace
        data={minimalResponse()}
        loading={false}
        error={null}
        loadNextPage={loadNextPage}
        loadingMore={false}
        appliedStatus="PENDING_CONFIRMATION"
      />,
    );
    expect(screen.getByTestId("relational-orders-next-cursor-display").textContent).toContain("nextOrderCursor=");
    expect(screen.getByTestId("relational-orders-pagination-summary").textContent).toContain("tronqué");
    expect(screen.getByTestId("relational-orders-pagination-api-note").textContent).toContain("orderCursor");
    expect(screen.getByTestId("relational-orders-active-filters").textContent).toContain("status=PENDING_CONFIRMATION");
    fireEvent.click(screen.getByTestId("relational-orders-load-next"));
    expect(loadNextPage).toHaveBeenCalledTimes(1);
  });

  it("flags unsupported EXPIRED filter via diagnostics", () => {
    const d = makeTestRelationalOrderDiagnostics({ requestedStatusUnsupported: true });
    render(
      <RelationalOrdersWorkspace
        data={{ policy: "ACTIVE", snapshot: { ...minimalResponse().snapshot, diagnostics: d } }}
        loading={false}
        error={null}
        appliedStatus="EXPIRED"
      />,
    );
    expect(screen.getByTestId("relational-orders-status-unsupported").textContent).toContain("EXPIRED");
  });
});
