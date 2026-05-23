import { describe, expect, it } from "vitest";

import { applyLocaleDirection, getLocaleDirection, isRtlLocale } from "./venext-rtl";

describe("venext RTL (20.77)", () => {
  it("ar is RTL", () => {
    expect(isRtlLocale("ar")).toBe(true);
    expect(getLocaleDirection("ar")).toBe("rtl");
  });

  it("fr-CI is LTR", () => {
    expect(isRtlLocale("fr-CI")).toBe(false);
    expect(getLocaleDirection("fr-CI")).toBe("ltr");
  });

  it("en is LTR", () => {
    expect(getLocaleDirection("en")).toBe("ltr");
  });

  it("zh-CN is LTR", () => {
    expect(getLocaleDirection("zh-CN")).toBe("ltr");
  });

  it("applyLocaleDirection sets document dir", () => {
    const doc = document.implementation.createHTMLDocument("test");
    const dir = applyLocaleDirection("ar", doc);
    expect(dir).toBe("rtl");
    expect(doc.documentElement.getAttribute("dir")).toBe("rtl");
    expect(doc.documentElement.classList.contains("venext-rtl")).toBe(true);
  });

  it("applyLocaleDirection clears rtl class for fr", () => {
    const doc = document.implementation.createHTMLDocument("test");
    applyLocaleDirection("ar", doc);
    applyLocaleDirection("fr-CI", doc);
    expect(doc.documentElement.getAttribute("dir")).toBe("ltr");
    expect(doc.documentElement.classList.contains("venext-rtl")).toBe(false);
  });
});
