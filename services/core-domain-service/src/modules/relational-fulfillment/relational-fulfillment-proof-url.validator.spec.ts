import { afterEach, describe, expect, it } from "vitest";

import { validateFulfillmentProofFileUrl } from "./relational-fulfillment-proof-url.validator";

describe("Instruction 20.9A — proof fileUrl validation", () => {
  const prev = process.env.VENEXT_PROOF_FILE_ALLOWED_HOSTS;

  afterEach(() => {
    if (prev === undefined) delete process.env.VENEXT_PROOF_FILE_ALLOWED_HOSTS;
    else process.env.VENEXT_PROOF_FILE_ALLOWED_HOSTS = prev;
  });

  it("accepts controlled relative /uploads path", () => {
    const r = validateFulfillmentProofFileUrl("/uploads/proofs/x.pdf");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mode).toBe("relative_uploads");
  });

  it("accepts HTTPS whitelist host when env set", () => {
    process.env.VENEXT_PROOF_FILE_ALLOWED_HOSTS = "allowed-domain.com";
    const r = validateFulfillmentProofFileUrl("https://allowed-domain.com/proof.pdf");
    expect(r.ok).toBe(true);
  });

  it("rejects http scheme", () => {
    const r = validateFulfillmentProofFileUrl("http://example.com/x");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("scheme_not_allowed");
  });

  it("rejects file:// scheme", () => {
    const r = validateFulfillmentProofFileUrl("file:///etc/passwd");
    expect(r.ok).toBe(false);
  });

  it("rejects localhost", () => {
    const r = validateFulfillmentProofFileUrl("http://localhost/x");
    expect(r.ok).toBe(false);
  });

  it("rejects javascript:", () => {
    const r = validateFulfillmentProofFileUrl("javascript:alert(1)");
    expect(r.ok).toBe(false);
  });
});
