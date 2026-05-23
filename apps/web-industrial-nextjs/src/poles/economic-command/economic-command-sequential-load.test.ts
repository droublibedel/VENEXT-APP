import { describe, expect, it } from "vitest";

import { loadEconomicCommandSlicesAll, loadEconomicCommandSlicesSequential } from "./economic-command-sequential-load";

describe("economic-command slice load (18.5A)", () => {
  it("requests all slice endpoints in parallel", async () => {
    const urls: string[] = [];
    const orig = globalThis.fetch;
    globalThis.fetch = ((input: RequestInfo) => {
      urls.push(String(input));
      return Promise.resolve(new Response(JSON.stringify({ data: {} }), { status: 200 })) as ReturnType<typeof fetch>;
    }) as typeof fetch;
    await loadEconomicCommandSlicesAll("31111111-1111-1111-1111-111111111101");
    globalThis.fetch = orig;
    expect(urls.some((u) => u.includes("/overview"))).toBe(true);
    expect(urls.some((u) => u.includes("/pressure-zones"))).toBe(true);
    expect(urls.some((u) => u.includes("/risks"))).toBe(true);
    expect(urls.some((u) => u.includes("/arbitrations"))).toBe(true);
    expect(urls.some((u) => u.includes("/tensions"))).toBe(true);
    expect(urls.some((u) => u.includes("/narrative"))).toBe(true);
    expect(urls.some((u) => u.includes("/stress"))).toBe(true);
    expect(urls.every((u) => u.includes("projection=summary"))).toBe(true);
  });

  it("loadEconomicCommandSlicesSequential aliases loadEconomicCommandSlicesAll", async () => {
    const urls: string[] = [];
    const orig = globalThis.fetch;
    globalThis.fetch = ((input: RequestInfo) => {
      urls.push(String(input));
      return Promise.resolve(new Response(JSON.stringify({ data: {} }), { status: 200 })) as ReturnType<typeof fetch>;
    }) as typeof fetch;
    await loadEconomicCommandSlicesSequential("31111111-1111-1111-1111-111111111101");
    globalThis.fetch = orig;
    expect(urls.some((u) => u.includes("/overview"))).toBe(true);
    expect(urls.some((u) => u.includes("/stress"))).toBe(true);
  });
});
