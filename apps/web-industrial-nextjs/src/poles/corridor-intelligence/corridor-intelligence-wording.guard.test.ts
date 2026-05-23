import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, ".");

const FILES = [
  "PoleWorkspace.tsx",
  "CorridorWorkspace.tsx",
  "CorridorRealtimeStrip.tsx",
  "surfaces/CorridorOverviewSurface.tsx",
  "surfaces/CorridorSignalsSurface.tsx",
  "surfaces/CorridorDiagnosticsSurface.tsx",
];

const BANNED = [
  /\btop seller\b/i,
  /\bbest trader\b/i,
  /\bpopular\b/i,
  /\btrending\b/i,
  /\bmost liked\b/i,
  /\branking\b/i,
  /\bleaderboard\b/i,
  /\bmarketplace ouverte\b/i,
  /\bstar rating\b/i,
  /\bétoiles\b/i,
  /\bscore\b/i,
  /\bnote\b/i,
  /\brating\b/i,
  /\btop\b/i,
  /\brank\b/i,
];

describe("Instruction 20.4 — corridor intelligence wording guard", () => {
  it("pole sources avoid gamified / marketplace reputation wording", () => {
    for (const f of FILES) {
      const text = readFileSync(join(root, f), "utf8");
      for (const re of BANNED) {
        expect(re.test(text), `${f} should not match ${String(re)}`).toBe(false);
      }
    }
  });
});
