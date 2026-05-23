import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("Instruction 19.2 — relational catalog wording guard", () => {
  const files = [
    "RelationalCatalogWorkspace.tsx",
    "surfaces/RelationalCatalogProductsSurface.tsx",
    "surfaces/RelationalCatalogDiagnosticsSurface.tsx",
    "PoleWorkspace.tsx",
  ];

  it("pole surfaces avoid ecommerce / social hype phrases", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const banned = [
      /discover products/i,
      /recommended for you/i,
      /social network/i,
      /open marketplace/i,
      /market appetite/i,
      /demand spike/i,
    ];
    for (const f of files) {
      const src = readFileSync(resolve(here, f), "utf8");
      for (const b of banned) {
        expect(src, f).not.toMatch(b);
      }
    }
  });
});
