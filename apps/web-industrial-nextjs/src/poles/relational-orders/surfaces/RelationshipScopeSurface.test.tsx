import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RELATIONAL_ORDER_CATALOG_SCOPE_CONTRAST } from "@venext/shared-contracts";

import { makeTestRelationalOrderDiagnostics } from "../relational-order-diagnostics.fixture";
import { RelationshipScopeSurface } from "./RelationshipScopeSurface";

afterEach(() => {
  cleanup();
});

describe("RelationshipScopeSurface", () => {
  it("shows catalog vs order scope contrast for wholesaler-aligned diagnostics", () => {
    const d = makeTestRelationalOrderDiagnostics({
      scopeExplanation: "Un grossiste lit ses catalogues fournisseurs en amont.",
    });
    render(
      <RelationshipScopeSurface
        viewerRole="WHOLESALER"
        relationshipScopeMode={d.viewerScopeMode}
        diagnostics={d}
      />,
    );
    expect(screen.getByTestId("relational-orders-order-scope-mode").textContent).toContain("INCIDENT_RELATION_ORDERS");
    expect(screen.getByTestId("relational-orders-catalog-scope-contrast").textContent).toContain(
      RELATIONAL_ORDER_CATALOG_SCOPE_CONTRAST,
    );
    expect(screen.getByTestId("relational-orders-catalog-order-scope-contrast").textContent).toContain(
      "Un grossiste lit ses catalogues fournisseurs en amont.",
    );
  });
});
