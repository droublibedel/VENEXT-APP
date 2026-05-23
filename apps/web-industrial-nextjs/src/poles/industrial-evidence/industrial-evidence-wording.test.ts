import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("Instruction 18.8 — industrial evidence UI wording", () => {
  it("workspace source avoids chatbot / magic-assistant tropes", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const paths = [
      resolve(here, "./IndustrialEvidenceWorkspace.tsx"),
      resolve(here, "./PoleWorkspace.tsx"),
      resolve(here, "./RegistryLegend.tsx"),
    ];
    const banned = ["chatbot", "assistant ia", "l'ia explique", "ia explique", "magical", "magic ai"];
    for (const p of paths) {
      const src = readFileSync(p, "utf8").toLowerCase();
      for (const b of banned) {
        expect(src.includes(b), `${p} should not include ${b}`).toBe(false);
      }
    }
  });
});
