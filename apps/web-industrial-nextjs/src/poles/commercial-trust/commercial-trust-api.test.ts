import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchCommercialTrustProfile } from "./commercial-trust-api";

describe("commercial-trust-api (20.3A Zod boundary)", () => {
  const origFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = origFetch;
    vi.restoreAllMocks();
  });

  it("returns commercial_trust_response_invalid when JSON does not match schema", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ notAProfile: true }),
    }) as unknown as typeof fetch;

    const r = await fetchCommercialTrustProfile("00000000-0000-4000-8000-000000000001");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("commercial_trust_response_invalid");
  });
});
