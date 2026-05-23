import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

describe("economic-command workspace copy", () => {
  it("surfaces advisory language and avoids chatbot framing", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const ws = readFileSync(resolve(here, "EconomicCommandWorkspace.tsx"), "utf8");
    expect(ws.toLowerCase()).toContain("consultatif");
    expect(ws.toLowerCase()).not.toContain("chatbot");
    expect(ws.toLowerCase()).not.toContain("ai operator");
  });
});
