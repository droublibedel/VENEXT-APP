import { describe, expect, it } from "vitest";

import {
  containsForbiddenEnterpriseWording,
  sanitizeCommerceFoundationText,
} from "./commerce-foundation-wording.guard";

describe("commerce wording sanitization (20.74-A)", () => {
  it("replaces warehouse with préparation", () => {
    expect(sanitizeCommerceFoundationText("warehouse zone A")).not.toMatch(/warehouse/i);
  });

  it("replaces picking", () => {
    expect(sanitizeCommerceFoundationText("picking list")).not.toMatch(/picking/i);
  });

  it("replaces ASN", () => {
    expect(sanitizeCommerceFoundationText("ASN pending")).not.toMatch(/\bASN\b/);
  });

  it("replaces supply chain operations", () => {
    const out = sanitizeCommerceFoundationText("supply chain operations");
    expect(out.toLowerCase()).toContain("flux commercial");
  });

  it("replaces banking dashboard", () => {
    expect(sanitizeCommerceFoundationText("banking dashboard")).not.toMatch(/banking dashboard/i);
  });

  it("replaces réseau social", () => {
    expect(sanitizeCommerceFoundationText("réseau social")).not.toMatch(/réseau social/i);
  });

  it("blocks analytics jargon wholesale", () => {
    expect(sanitizeCommerceFoundationText("scoring algorithme")).toBe("activité commerciale");
  });

  it("respects flag off", () => {
    expect(
      sanitizeCommerceFoundationText("warehouse", { commerce_anti_erp_wording_enabled: false }),
    ).toBe("warehouse");
  });

  it("detects forbidden enterprise wording", () => {
    expect(containsForbiddenEnterpriseWording("ERP workflow")).toBe(true);
    expect(containsForbiddenEnterpriseWording("Commande partenaire")).toBe(false);
  });

  it("trims and collapses whitespace", () => {
    expect(sanitizeCommerceFoundationText("  hello   world  ")).toBe("hello world");
  });
});
