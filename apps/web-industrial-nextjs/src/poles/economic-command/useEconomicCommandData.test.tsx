import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useEconomicCommandData } from "./useEconomicCommandData";

const org = { organizationId: "31111111-1111-1111-1111-111111111101", source: "demo_fallback" as const };

describe("useEconomicCommandData (18.5A)", () => {
  it("does not request slice endpoints after a successful bundle fetch", async () => {
    const urls: string[] = [];
    const orig = globalThis.fetch;
    globalThis.fetch = vi.fn((input: RequestInfo) => {
      urls.push(String(input));
      return Promise.resolve(
        new Response(JSON.stringify({ version: "1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ) as ReturnType<typeof fetch>;
    }) as typeof fetch;
    const { result } = renderHook(() => useEconomicCommandData(org));
    await waitFor(() => expect(result.current.loading).toBe(false));
    globalThis.fetch = orig;
    expect(urls.some((u) => u.includes("/bundle"))).toBe(true);
    expect(urls.some((u) => u.includes("/overview"))).toBe(false);
    expect(urls.some((u) => u.includes("/narrative"))).toBe(false);
  });

  it("requests parallel slices when bundle is unavailable then hydrates degraded bundle", async () => {
    const urls: string[] = [];
    const orig = globalThis.fetch;
    globalThis.fetch = vi.fn((input: RequestInfo) => {
      const u = String(input);
      urls.push(u);
      if (u.includes("/bundle")) {
        return Promise.resolve(new Response(null, { status: 404 })) as ReturnType<typeof fetch>;
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ) as ReturnType<typeof fetch>;
    }) as typeof fetch;
    const { result } = renderHook(() => useEconomicCommandData(org));
    await waitFor(() => expect(result.current.loading).toBe(false));
    globalThis.fetch = orig;
    expect(urls.some((u) => u.includes("/bundle"))).toBe(true);
    expect(urls.filter((u) => u.includes("/overview")).length).toBeGreaterThanOrEqual(1);
    expect(urls.some((u) => u.includes("/pressure-zones"))).toBe(true);
    expect(urls.some((u) => u.includes("/narrative"))).toBe(true);
    expect(result.current.bundle?.degraded).toBe(true);
    expect(result.current.bundle?.sourceMode).toBe("SEQUENTIAL_SLICE_FALLBACK");
    expect(result.current.bundle?.missingSlices?.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });
});
