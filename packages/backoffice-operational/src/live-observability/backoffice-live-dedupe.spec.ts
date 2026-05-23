import { afterEach, describe, expect, it } from "vitest";

import { liveEventFingerprint, resetLiveDedupeForTests, shouldDedupeLiveEvent } from "./backoffice-live-observability-dedupe.js";

afterEach(() => resetLiveDedupeForTests());

describe("backoffice-live-dedupe", () => {
  it("fingerprints stable parts", () => {
    expect(liveEventFingerprint(["a", "b", ""])).toBe("a|b");
  });

  it("dedupes within window", () => {
    const fp = "dup-test";
    expect(shouldDedupeLiveEvent(fp)).toBe(false);
    expect(shouldDedupeLiveEvent(fp)).toBe(true);
  });

  it("allows after custom short window", () => {
    const fp = "short";
    shouldDedupeLiveEvent(fp, 1);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(shouldDedupeLiveEvent(fp, 1)).toBe(false);
        resolve();
      }, 5);
    });
  });

  it.each(Array.from({ length: 20 }, (_, i) => `key-${i}`))("tracks independent fingerprint %s", (fp) => {
    expect(shouldDedupeLiveEvent(fp)).toBe(false);
    expect(shouldDedupeLiveEvent(fp)).toBe(true);
  });

  it("truncates fingerprint length", () => {
    const fp = liveEventFingerprint(["x".repeat(500)]);
    expect(fp.length).toBeLessThanOrEqual(240);
  });
});
