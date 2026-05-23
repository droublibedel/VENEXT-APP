import { describe, expect, it } from "vitest";

import { fetchIndustrialOperationalContinuityBundleJson } from "./industrial-operational-continuity-api";

describe("industrial-operational-continuity-api BFF paths", () => {
  it("bundle fetch targets summary projection on BFF", async () => {
    const calls: string[] = [];
    const orig = globalThis.fetch;
    globalThis.fetch = ((input: RequestInfo) => {
      calls.push(String(input));
      return Promise.resolve(new Response(JSON.stringify({ version: "1" }), { status: 200 })) as ReturnType<typeof fetch>;
    }) as typeof fetch;
    await fetchIndustrialOperationalContinuityBundleJson("31111111-1111-1111-1111-111111111101");
    globalThis.fetch = orig;
    expect(calls[0]).toContain("/api/industrial-operational-continuity/v1/industrial-operational-continuity/bundle");
    expect(calls[0]).toContain("projection=summary");
  });
});
