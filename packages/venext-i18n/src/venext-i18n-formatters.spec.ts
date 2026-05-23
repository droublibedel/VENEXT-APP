import { describe, expect, it } from "vitest";

import { createVenextFormatters } from "./venext-formatters";

describe("venext formatters (20.77)", () => {
  it("formats XOF for fr-CI", () => {
    const f = createVenextFormatters("fr-CI");
    expect(f.currencyXof(25000)).toMatch(/25/);
    expect(f.currencyXof(25000)).toMatch(/FCFA/);
  });

  it("formats XOF for en", () => {
    const f = createVenextFormatters("en");
    expect(f.currencyXof(25000)).toMatch(/XOF/);
  });

  it("formats XOF for ar", () => {
    const f = createVenextFormatters("ar");
    expect(f.currencyXof(25000)).toMatch(/فرنك|CFA/);
  });

  it("formats XOF for zh-CN", () => {
    const f = createVenextFormatters("zh-CN");
    expect(f.currencyXof(25000)).toMatch(/西非|法郎/);
  });

  it("dateShort returns readable string", () => {
    const f = createVenextFormatters("fr-CI");
    expect(f.dateShort("2026-05-18")).toBeTruthy();
  });

  it("dateLong includes year", () => {
    const f = createVenextFormatters("en");
    expect(f.dateLong("2026-05-18")).toMatch(/2026/);
  });

  it("time formats hours", () => {
    const f = createVenextFormatters("fr-CI");
    expect(f.time(new Date("2026-05-18T14:30:00"))).toMatch(/\d/);
  });

  it("number formats decimals", () => {
    const f = createVenextFormatters("en");
    expect(f.number(1234.5)).toMatch(/1/);
  });

  it("quantity appends unit", () => {
    const f = createVenextFormatters("fr-CI");
    expect(f.quantity(12, "cartons")).toMatch(/cartons/);
  });

  it("percent formats ratio", () => {
    const f = createVenextFormatters("en");
    expect(f.percent(42)).toMatch(/%/);
  });
});
