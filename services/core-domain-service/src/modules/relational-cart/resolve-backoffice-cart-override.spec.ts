import { describe, expect, it } from "vitest";

import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import type { VenextRequestActor } from "../../platform-authz/venext-authz.types";

import { resolveBackofficeCartOverride } from "./resolve-backoffice-cart-override";

describe("Instruction 20.5A — resolveBackofficeCartOverride", () => {
  it("buyer / participant cannot grant override from body alone", () => {
    const actor: VenextRequestActor = {
      userId: "u1",
      organizationId: "o1",
      backofficeCommercialTrustFull: false,
    };
    const req: VenextHttpLike = { headers: {}, query: {}, params: {} };
    const r = resolveBackofficeCartOverride(actor, req, true);
    expect(r.allowRestrictedCommerceForBackoffice).toBe(false);
    expect(r.diagnostics.backofficeOverrideRequested).toBe(true);
    expect(r.diagnostics.backofficeOverrideGranted).toBe(false);
    expect(r.diagnostics.backofficeOverrideSource).toBe("none");
  });

  it("backoffice actor grants only with explicit header", () => {
    const actor: VenextRequestActor = {
      userId: "u1",
      organizationId: "o1",
      backofficeCommercialTrustFull: true,
    };
    const reqNoHeader: VenextHttpLike = { headers: {}, query: {}, params: {} };
    expect(resolveBackofficeCartOverride(actor, reqNoHeader, true).allowRestrictedCommerceForBackoffice).toBe(false);

    const reqHeader: VenextHttpLike = {
      headers: { "x-venext-restricted-commerce-override": "granted" },
      query: {},
      params: {},
    };
    const r = resolveBackofficeCartOverride(actor, reqHeader, true);
    expect(r.allowRestrictedCommerceForBackoffice).toBe(true);
    expect(r.diagnostics.backofficeOverrideGranted).toBe(true);
    expect(r.diagnostics.backofficeOverrideSource).toBe("backoffice_actor");
  });

  it("internal key grants override without body", () => {
    const prev = process.env.VENEXT_INTERNAL_REALTIME_KEY;
    process.env.VENEXT_INTERNAL_REALTIME_KEY = "secret-int";
    const actor: VenextRequestActor = { organizationId: "o1" };
    const req: VenextHttpLike = {
      headers: { "x-venext-internal-key": "secret-int" },
      query: {},
      params: {},
    };
    const r = resolveBackofficeCartOverride(actor, req, false);
    expect(r.allowRestrictedCommerceForBackoffice).toBe(true);
    expect(r.diagnostics.backofficeOverrideSource).toBe("internal_token");
    process.env.VENEXT_INTERNAL_REALTIME_KEY = prev;
  });

  it("seller cannot spoof via body", () => {
    const actor: VenextRequestActor = {
      userId: "u1",
      organizationId: "o-seller",
      backofficeCommercialTrustFull: false,
    };
    const req: VenextHttpLike = { headers: {}, query: {}, params: {} };
    expect(resolveBackofficeCartOverride(actor, req, true).allowRestrictedCommerceForBackoffice).toBe(false);
  });
});
