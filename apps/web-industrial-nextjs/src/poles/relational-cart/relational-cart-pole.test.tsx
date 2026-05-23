import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { POLE_REGISTRY } from "../registry";
import PoleWorkspace from "./PoleWorkspace";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

import { useSearchParams } from "next/navigation";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Instruction 20.6A — relational-cart pole", () => {
  it("registry contains relational-cart", () => {
    expect(POLE_REGISTRY.some((p) => p.slug === "relational-cart")).toBe(true);
  });

  it("PoleEntryClient source includes relational-cart case", () => {
    const src = readFileSync(join(__dirname, "../shell/PoleEntryClient.tsx"), "utf8");
    expect(src).toContain('case "relational-cart"');
  });

  it("catalog post-add link targets relational-cart pole", () => {
    const src = readFileSync(join(__dirname, "../relational-catalog/surfaces/RelationalCatalogProductsSurface.tsx"), "utf8");
    expect(src).toContain("/poles/relational-cart?cartId=");
    expect(src).not.toContain("/poles/relational-catalog?cartId=");
  });

  it("without cartId shows no selection copy", async () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as ReturnType<typeof useSearchParams>);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("offline")),
    );
    render(<PoleWorkspace />);
    await waitFor(() => {
      expect(screen.getByTestId("relational-cart-no-selection-banner").textContent).toContain("Aucun panier relationnel sélectionné");
    });
  });

  it("with cartId calls fetch for cart payload", async () => {
    const cartId = "550e8400-e29b-41d4-a716-446655440001";
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(`cartId=${cartId}`) as ReturnType<typeof useSearchParams>);
    const payload = {
      cart: {
        id: cartId,
        organizationId: "31111111-1111-1111-1111-111111111102",
        buyerOrganizationId: "31111111-1111-1111-1111-111111111102",
        sellerOrganizationId: "550e8400-e29b-41d4-a716-446655440003",
        relationshipId: "550e8400-e29b-41d4-a716-446655440004",
        negotiationId: null,
        threadId: null,
        sourceType: "MANUAL_RELATIONAL_ENTRY",
        status: "READY_FOR_REVIEW",
        corridorStateAtCreation: "ACTIVE",
        corridorGovernanceValidated: true,
        corridorOperationalWarnings: [],
        corridorPolicySource: "RelationshipGovernancePolicyService.assertCorridorOperational",
        commercialTrustBand: null,
        requiresBuyerSellerConfirmation: true,
        conversionBlockedReason: null,
        cartConvertibleToOrder: true,
        createdByUserId: "550e8400-e29b-41d4-a716-446655440005",
        expiresAt: null,
        convertedOrderId: null,
        metadata: {},
        buyerConfirmedAt: null,
        sellerConfirmedAt: null,
        buyerConfirmedByUserId: null,
        sellerConfirmedByUserId: null,
        lockedAt: null,
        lockedByUserId: null,
        rejectedAt: null,
        rejectedByUserId: null,
        rejectionReason: null,
        confirmationDiagnostics: {},
        lockDiagnostics: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
      },
      diagnostics: {
        relationshipScoped: true,
        publicMarketplaceDisabled: true,
        checkoutPublicDisabled: true,
        paymentExecutionDisabled: true,
        stockReservationDisabled: true,
        walletDebitDisabled: true,
        corridorGovernanceRequired: true,
        corridorGovernanceValidated: true,
        corridorPolicySource: "x",
        heuristicOnly: true,
        sourceTypeReadiness: {
          NEGOTIATION_ACCEPTED: "READY",
          CONVERSATIONAL_DRAFT_CONFIRMED: "READY",
          SPONSORED_PRINCIPLE_AGREEMENT: "READY",
          MANUAL_RELATIONAL_ENTRY: "CONNECTED",
          RELATIONAL_REORDER: "NOT_CONNECTED_YET",
        },
        buyerConfirmed: false,
        sellerConfirmed: false,
        bothPartiesConfirmed: false,
        lockEligible: false,
        conversionEligible: false,
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo) => {
        const u = String(input);
        if (u.includes("/api/core/v1/feature-flags")) {
          return Promise.resolve({ ok: true, json: async () => [] });
        }
        if (u.includes(`/api/core/v1/relational-cart/${cartId}`)) {
          return Promise.resolve({ ok: true, json: async () => payload });
        }
        return Promise.reject(new Error(`unexpected fetch ${u}`));
      }),
    );
    render(<PoleWorkspace />);
    await waitFor(() => {
      expect(screen.getByTestId("relational-cart-overview").textContent).toContain("MANUAL_RELATIONAL_ENTRY");
    });
  });

  it("buyer demo org sees buyer confirm enabled and seller confirm disabled", async () => {
    const cartId = "550e8400-e29b-41d4-a716-446655440001";
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(`cartId=${cartId}`) as ReturnType<typeof useSearchParams>);
    const payload = {
      cart: {
        id: cartId,
        organizationId: "31111111-1111-1111-1111-111111111102",
        buyerOrganizationId: "31111111-1111-1111-1111-111111111102",
        sellerOrganizationId: "550e8400-e29b-41d4-a716-446655440003",
        relationshipId: "550e8400-e29b-41d4-a716-446655440004",
        negotiationId: null,
        threadId: null,
        sourceType: "MANUAL_RELATIONAL_ENTRY",
        status: "READY_FOR_REVIEW",
        corridorStateAtCreation: "ACTIVE",
        corridorGovernanceValidated: true,
        corridorOperationalWarnings: [],
        corridorPolicySource: "RelationshipGovernancePolicyService.assertCorridorOperational",
        commercialTrustBand: null,
        requiresBuyerSellerConfirmation: true,
        conversionBlockedReason: null,
        cartConvertibleToOrder: true,
        createdByUserId: "550e8400-e29b-41d4-a716-446655440005",
        expiresAt: null,
        convertedOrderId: null,
        metadata: {},
        buyerConfirmedAt: null,
        sellerConfirmedAt: null,
        buyerConfirmedByUserId: null,
        sellerConfirmedByUserId: null,
        lockedAt: null,
        lockedByUserId: null,
        rejectedAt: null,
        rejectedByUserId: null,
        rejectionReason: null,
        confirmationDiagnostics: {},
        lockDiagnostics: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
      },
      diagnostics: {
        relationshipScoped: true,
        publicMarketplaceDisabled: true,
        checkoutPublicDisabled: true,
        paymentExecutionDisabled: true,
        stockReservationDisabled: true,
        walletDebitDisabled: true,
        corridorGovernanceRequired: true,
        corridorGovernanceValidated: true,
        corridorPolicySource: "x",
        heuristicOnly: true,
        sourceTypeReadiness: {
          NEGOTIATION_ACCEPTED: "READY",
          CONVERSATIONAL_DRAFT_CONFIRMED: "READY",
          SPONSORED_PRINCIPLE_AGREEMENT: "READY",
          MANUAL_RELATIONAL_ENTRY: "CONNECTED",
          RELATIONAL_REORDER: "NOT_CONNECTED_YET",
        },
        buyerConfirmed: false,
        sellerConfirmed: false,
        bothPartiesConfirmed: false,
        lockEligible: false,
        conversionEligible: false,
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo) => {
        const u = String(input);
        if (u.includes("/api/core/v1/feature-flags")) {
          return Promise.resolve({
            ok: true,
            json: async () => [
              { key: "industrial_poles_enabled", enabled: true },
              { key: "relational_cart_enabled", enabled: true },
              { key: "relational_cart_review_enabled", enabled: true },
              { key: "relational_cart_dual_confirmation_enabled", enabled: true },
              { key: "relational_cart_lock_enabled", enabled: true },
            ],
          });
        }
        if (u.includes(`/api/core/v1/relational-cart/${cartId}`)) {
          return Promise.resolve({ ok: true, json: async () => payload });
        }
        return Promise.reject(new Error(`unexpected fetch ${u}`));
      }),
    );
    render(<PoleWorkspace />);
    await waitFor(() => {
      expect((screen.getByTestId("relational-cart-confirm-buyer") as HTMLButtonElement).disabled).toBe(false);
    });
    expect((screen.getByTestId("relational-cart-confirm-seller") as HTMLButtonElement).disabled).toBe(true);
  });

  it("invalid cart payload surfaces Zod contract error", async () => {
    const cartId = "550e8400-e29b-41d4-a716-446655440001";
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(`cartId=${cartId}`) as ReturnType<typeof useSearchParams>);
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo) => {
        const u = String(input);
        if (u.includes("/api/core/v1/feature-flags")) {
          return Promise.resolve({ ok: true, json: async () => [] });
        }
        if (u.includes(`/api/core/v1/relational-cart/${cartId}`)) {
          return Promise.resolve({ ok: true, json: async () => ({ unexpected: true }) });
        }
        return Promise.reject(new Error(`unexpected fetch ${u}`));
      }),
    );
    render(<PoleWorkspace />);
    await waitFor(() => {
      const nodes = screen.getAllByText(/Réponse API non conforme au contrat \(Zod\)/i);
      expect(nodes.length).toBeGreaterThan(0);
    });
  });
});
