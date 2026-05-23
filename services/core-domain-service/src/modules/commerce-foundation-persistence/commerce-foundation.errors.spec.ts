import { describe, expect, it } from "vitest";

import {
  COMMERCE_FOUNDATION_ERRORS,
  commerceFoundationUxError,
} from "./commerce-foundation.errors";

describe("commerce-foundation UX errors (20.79)", () => {
  for (const [code, message] of Object.entries(COMMERCE_FOUNDATION_ERRORS)) {
    it(`${code} is short and human`, () => {
      expect(message.length).toBeLessThan(120);
      expect(message).not.toMatch(/stack|exception|500|401|403/i);
      expect(commerceFoundationUxError(code as keyof typeof COMMERCE_FOUNDATION_ERRORS)).toBe(message);
    });
  }

  it("catalog error is commerce-first", () => {
    expect(commerceFoundationUxError("catalogUnavailable")).toMatch(/catalogue/i);
  });

  it("wallet error mentions activation", () => {
    expect(commerceFoundationUxError("walletNotActivated")).toMatch(/règlement/i);
  });
});
