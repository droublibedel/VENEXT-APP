import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useIndustrialEvidenceData } from "./useIndustrialEvidenceData";

const orgId = "41111111-1111-1111-1111-111111111101";

describe("useIndustrialEvidenceData (18.8A bundle-first)", () => {
  it("requests only the bundle endpoint when bundle returns OK — no parallel trust-matrix / traces slices", async () => {
    const urls: string[] = [];
    const orig = globalThis.fetch;
    globalThis.fetch = vi.fn((input: RequestInfo) => {
      urls.push(String(input));
      return Promise.resolve(
        new Response(
          JSON.stringify({
            policy: "ACTIVE",
            disclaimer: "d",
            snapshot: {
              headline: "h",
              records: [{ evidenceId: "r1" }],
              trustMatrix: [],
              traces: [],
              limitations: [],
              sourceMap: [],
              diagnostics: { degradedBundleMode: false },
              evidenceScope: {},
              interpretationBoundary: "ib",
              reliabilityBoundary: "rb",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ) as ReturnType<typeof fetch>;
    }) as typeof fetch;
    const { result } = renderHook(() => useIndustrialEvidenceData(orgId));
    await waitFor(() => expect(result.current.loading).toBe(false));
    globalThis.fetch = orig;
    expect(urls.length).toBe(1);
    expect(urls[0]).toContain("/api/industrial-evidence/v1/industrial-evidence/bundle");
    expect(urls.some((u) => u.includes("trust-matrix"))).toBe(false);
    expect(urls.some((u) => u.includes("/traces"))).toBe(false);
    expect(result.current.bundle?.snapshot?.records?.length).toBeGreaterThan(0);
    expect(result.current.degradedBundleMode).toBe(false);
    expect(result.current.fallbackSource).toBeNull();
  });

  it("marks degraded fallback metadata when snapshot records are missing — still no slice fetches", async () => {
    const urls: string[] = [];
    const orig = globalThis.fetch;
    globalThis.fetch = vi.fn((input: RequestInfo) => {
      urls.push(String(input));
      return Promise.resolve(
        new Response(
          JSON.stringify({
            policy: "ACTIVE",
            disclaimer: "d",
            snapshot: {
              headline: "h",
              records: undefined,
              trustMatrix: [],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ) as ReturnType<typeof fetch>;
    }) as typeof fetch;
    const { result } = renderHook(() => useIndustrialEvidenceData(orgId));
    await waitFor(() => expect(result.current.loading).toBe(false));
    globalThis.fetch = orig;
    expect(urls.length).toBe(1);
    expect(result.current.degradedBundleMode).toBe(true);
    expect(result.current.fallbackSource).toBe("bundle_snapshot_incomplete");
    expect(result.current.fallbackReason).toContain("not_implemented");
  });
});
