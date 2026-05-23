import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Instruction 19.2B — ensure legacy misleading signal name does not reappear in relational-catalog runtime sources.
 */
describe("Instruction 19.2B — relational catalog runtime signal naming", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const accessSrc = readFileSync(resolve(here, "relational-catalog-access.service.ts"), "utf8");

  it("relational-catalog-access.service has no rising_interest_signal literal", () => {
    expect(accessSrc).not.toContain("rising_interest_signal");
  });

  it("relational-catalog-access.service emits relational_catalog_density_signal instead", () => {
    expect(accessSrc).toContain("relational_catalog_density_signal");
  });
});
