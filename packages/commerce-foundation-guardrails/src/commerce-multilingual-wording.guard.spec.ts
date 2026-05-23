import { describe, expect, it } from "vitest";

import { sanitizeTranslatedCommerceText } from "./commerce-multilingual-wording.guard";

describe("commerce multilingual wording guard (20.77)", () => {
  it("sanitizes ERP in French", () => {
    expect(sanitizeTranslatedCommerceText("Module ERP", "fr-CI")).not.toMatch(/ERP/i);
  });

  it("sanitizes marketplace in English", () => {
    expect(sanitizeTranslatedCommerceText("global marketplace", "en")).not.toMatch(/marketplace/i);
  });
});
