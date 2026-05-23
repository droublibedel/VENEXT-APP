import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("Instruction 20.0 — relational orders wording guard", () => {
  const files = [
    "RelationalOrdersWorkspace.tsx",
    "surfaces/RelationalOrdersCorridorSurface.tsx",
    "surfaces/RelationalOrdersDiagnosticsSurface.tsx",
    "surfaces/RelationshipScopeSurface.tsx",
    "PoleWorkspace.tsx",
  ];

  it("pole surfaces avoid ecommerce / marketplace hype phrases", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const banned = [/buy now/i, /open marketplace/i, /recommended for you/i, /amazon/i, /marketplace feed/i];
    for (const f of files) {
      const src = readFileSync(resolve(here, f), "utf8");
      for (const b of banned) {
        expect(src, f).not.toMatch(b);
      }
    }
  });
});
