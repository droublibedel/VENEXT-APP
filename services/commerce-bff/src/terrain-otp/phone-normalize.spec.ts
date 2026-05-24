import { describe, expect, it } from "vitest";

import { formatInternationalPhone, normalizeCiPhone } from "./phone-normalize.js";
import { readYellikaProviderMessage } from "./yellika-sms.client.js";

describe("phone normalize for Yellika", () => {
  it("formats E.164 with plus prefix", () => {
    expect(formatInternationalPhone("2250701020304")).toBe("+2250701020304");
    expect(formatInternationalPhone("+2250701020304")).toBe("+2250701020304");
  });

  it("normalizes local ivorian numbers", () => {
    expect(normalizeCiPhone("+225 07 01 02 03 04")).toBe("2250701020304");
    expect(normalizeCiPhone("0701020304")).toBe("2250701020304");
    expect(normalizeCiPhone("07 01 02 03 04")).toBe("2250701020304");
  });
});

describe("Yellika provider errors", () => {
  it("reads validation message from provider body", () => {
    expect(
      readYellikaProviderMessage({
        message: ["Le numéro de téléphone est invalide.", "Il doit être au format international."],
      }),
    ).toBe("Le numéro de téléphone est invalide. Il doit être au format international.");
  });
});
