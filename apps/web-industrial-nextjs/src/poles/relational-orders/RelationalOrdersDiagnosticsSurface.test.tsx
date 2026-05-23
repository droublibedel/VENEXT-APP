import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RelationalOrdersDiagnosticsSurface } from "./surfaces/RelationalOrdersDiagnosticsSurface";

import { makeTestRelationalOrderDiagnostics } from "./relational-order-diagnostics.fixture";

afterEach(() => {
  cleanup();
});

describe("RelationalOrdersDiagnosticsSurface", () => {
  it("surfaces honesty flags", () => {
    render(<RelationalOrdersDiagnosticsSurface diagnostics={makeTestRelationalOrderDiagnostics()} />);
    expect(screen.getByTestId("relational-orders-diagnostics").textContent).toContain("Paiement intégré");
    expect(screen.getByTestId("relational-orders-heuristic-warning").textContent).toContain("heuristiques");
  });

  it("shows order type readiness and catalog policy note", () => {
    render(<RelationalOrdersDiagnosticsSurface diagnostics={makeTestRelationalOrderDiagnostics()} />);
    expect(screen.getByTestId("relational-orders-order-type-readiness").textContent).toContain("NEGOTIATED_ORDER");
    expect(screen.getByTestId("relational-orders-order-type-readiness").textContent).toContain("NOT_CONNECTED_YET");
    expect(screen.getByTestId("relational-orders-catalog-policy-note").textContent).toContain(
      "ORDER_ITEM_PRODUCT_REFERENCE",
    );
  });

  it("shows signal and status readiness", () => {
    render(<RelationalOrdersDiagnosticsSurface diagnostics={makeTestRelationalOrderDiagnostics()} />);
    expect(screen.getByTestId("relational-orders-signal-readiness").textContent).toContain(
      "REQUIRES_DEEPER_ORDER_ITEM_ANALYSIS",
    );
    expect(screen.getByTestId("relational-orders-status-readiness").textContent).toContain(
      "NOT_CONNECTED_YET_NO_EXPIRY_SOURCE",
    );
  });
});
