import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, ".");

const FILES = [
  "RelationshipGraphWorkspace.tsx",
  "PoleWorkspace.tsx",
  "surfaces/RelationshipGraphLegend.tsx",
  "RelationshipGraphRealtimeStrip.tsx",
];

const BANNED = [
  /\bsocial feed\b/i,
  /\bfollowers?\b/i,
  /\bLinkedIn\b/i,
  /\bopen marketplace\b/i,
];

describe("Instruction 19.1 — commercial relationship graph wording guard", () => {
  it("pole sources avoid social / open-market product wording", () => {
    for (const f of FILES) {
      const text = readFileSync(join(root, f), "utf8");
      for (const re of BANNED) {
        expect(re.test(text), `${f} should not match ${String(re)}`).toBe(false);
      }
    }
  });
});
