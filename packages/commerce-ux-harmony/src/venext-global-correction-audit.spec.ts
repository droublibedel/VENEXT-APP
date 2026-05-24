import { describe, expect, it } from "vitest";

import {
  VenextColorTokens,
  auditVenextDemoDataIntegrity,
  auditVenextForbiddenDarkGreenUsage,
  auditVenextTextContrast,
} from "./audit/venext-global-correction-audit";

describe("VENEXT-GLOBAL-CORRECTION-01 color rules", () => {
  it("defines the official green as an accent, not the dark legacy surface", () => {
    expect(VenextColorTokens.accent.primary).toBe("#00A884");
    expect(VenextColorTokens.background.primary).toBe("#FFFFFF");
    expect(VenextColorTokens.legacy.darkGreenSurface).toBe("#075E54");
  });

  it("detects legacy dark green used in UI source", () => {
    const result = auditVenextForbiddenDarkGreenUsage({
      "Card.tsx": `<section style={{ background: "#075E54" }}>Total</section>`,
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.rule).toBe("legacy_dark_green_surface");
  });

  it("detects terminal-like dark surfaces", () => {
    const result = auditVenextForbiddenDarkGreenUsage({
      "Wallet.css": `.wallet { background: #0b1412; }`,
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.rule).toBe("terminal_surface");
  });

  it("allows the official accent on a CTA", () => {
    const result = auditVenextForbiddenDarkGreenUsage({
      "Button.css": `.cta { background: #00A884; color: #FFFFFF; }`,
    });

    expect(result.ok).toBe(true);
  });
});

describe("VENEXT-GLOBAL-CORRECTION-01 contrast rules", () => {
  it("accepts dark readable text on white surfaces", () => {
    const result = auditVenextTextContrast([
      { source: "home-title", foreground: "#17201C", background: "#FFFFFF" },
    ]);

    expect(result.ok).toBe(true);
  });

  it("rejects weak grey text on white surfaces", () => {
    const result = auditVenextTextContrast([
      { source: "muted-copy", foreground: "#C9D0CC", background: "#FFFFFF" },
    ]);

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.minimum).toBe(4.5);
  });
});

describe("VENEXT-GLOBAL-CORRECTION-01 demo data integrity", () => {
  it("validates coherent dashboard sales and relationships", () => {
    const result = auditVenextDemoDataIntegrity({
      dashboard: { salesTodayFcfa: 3500, activePartnerIds: ["partner-1"] },
      partners: [{ id: "partner-1", active: true }],
      products: [{ id: "product-1", visible: true }],
      orders: [{ id: "order-1", amountFcfa: 3500, partnerId: "partner-1", productIds: ["product-1"] }],
      invitations: [{ id: "invitation-1", partnerId: "partner-1" }],
    });

    expect(result.ok).toBe(true);
  });

  it("rejects dashboard sales that are not calculated from orders", () => {
    const result = auditVenextDemoDataIntegrity({
      dashboard: { salesTodayFcfa: 4000 },
      orders: [{ id: "order-1", amountFcfa: 3500 }],
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.rule).toBe("sales_mismatch");
  });

  it("rejects orders linked to missing products", () => {
    const result = auditVenextDemoDataIntegrity({
      partners: [{ id: "partner-1" }],
      products: [{ id: "product-1" }],
      orders: [{ id: "order-1", amountFcfa: 1000, partnerId: "partner-1", productIds: ["product-2"] }],
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.rule).toBe("missing_order_product");
  });
});
