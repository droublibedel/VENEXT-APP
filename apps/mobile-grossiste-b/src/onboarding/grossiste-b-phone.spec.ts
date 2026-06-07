import { describe, expect, it } from "vitest";

import {
  formatLocalCiPhoneDisplay,
  isValidLocalCiPhone,
  sanitizeLocalCiPhoneInput,
  toInternationalCiPhone,
} from "./grossiste-b-phone";

describe("grossiste B local phone", () => {
  it("sanitizes to max 10 digits starting with 0", () => {
    expect(sanitizeLocalCiPhoneInput("07 01 02 03 04")).toBe("0701020304");
    expect(sanitizeLocalCiPhoneInput("+2250701020304")).toBe("0701020304");
    expect(sanitizeLocalCiPhoneInput("701020304")).toBe("0701020304");
  });

  it("formats display as 0X XX XX XX XX", () => {
    expect(formatLocalCiPhoneDisplay("0701020304")).toBe("07 01 02 03 04");
  });

  it("validates exactly 10 digits", () => {
    expect(isValidLocalCiPhone("0701020304")).toBe(true);
    expect(isValidLocalCiPhone("070102030")).toBe(false);
    expect(isValidLocalCiPhone("+2250701020304")).toBe(true);
  });

  it("converts to international for API", () => {
    expect(toInternationalCiPhone("0701020304")).toBe("+2250701020304");
  });
});
