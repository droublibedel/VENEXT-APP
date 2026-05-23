import { describe, expect, it, vi } from "vitest";
import {
  allocateUniqueCommercialId,
  generateTenDigitCommercialId,
  isValidCommercialIdFormat,
  normalizeCommercialId,
} from "./commercial-id";

describe("commercialId (Instruction 4A)", () => {
  it("generates exactly 10 numeric digits", () => {
    for (let i = 0; i < 30; i++) {
      const id = generateTenDigitCommercialId();
      expect(id).toMatch(/^\d{10}$/);
    }
  });

  it("validates 10-digit format after normalization", () => {
    expect(isValidCommercialIdFormat("4829 173 056")).toBe(true);
    expect(isValidCommercialIdFormat("482917305")).toBe(false);
    expect(isValidCommercialIdFormat("48291730561")).toBe(false);
  });

  it("normalize strips non-digits", () => {
    expect(normalizeCommercialId("+221 482-917-3056")).toBe("2214829173056");
  });

  it("allocateUniqueCommercialId returns unused id", async () => {
    const orgs = {
      findUnique: vi.fn().mockResolvedValue(null),
    };
    const id = await allocateUniqueCommercialId(orgs);
    expect(id).toMatch(/^\d{10}$/);
    expect(orgs.findUnique).toHaveBeenCalled();
  });
});
