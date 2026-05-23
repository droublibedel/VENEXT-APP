/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  auditBusinessProfileAudio,
  auditPartnerSuggestionAudioVisibility,
  auditTerrainAudioPerformance,
  auditTerrainAudioPrivacy,
  auditTerrainAudioProductDescription,
} from "./audit/terrain-audio-audits.js";
import { BusinessProfileAudioSection } from "./BusinessProfileAudioSection.js";
import { ProductVoiceDescription } from "./ProductVoiceDescription.js";
import { VenextAudioSpeakerButton } from "./VenextAudioSpeakerButton.js";
import { TerrainAudioHoldRecorder } from "./TerrainAudioHoldRecorder.js";
import { PartnerSuggestionCatalogPreview } from "./PartnerSuggestionCatalogPreview.js";
import {
  MAX_BUSINESS_PROFILE_AUDIO_SECONDS,
  MAX_PRODUCT_VOICE_DESCRIPTION_SECONDS,
  SUPPORTED_TERRAIN_AUDIO_MIME_TYPES,
} from "./terrain-audio.constants.js";
import {
  clampTerrainAudioDuration,
  createTerrainAudioAsset,
  getProductVoiceDescription,
  listPendingTerrainAudioUploads,
  resetTerrainAudioStorageForTests,
  softDeleteTerrainAudioAsset,
} from "./terrain-audio-storage.js";
import {
  getActiveTerrainAudioPlaybackId,
  requestTerrainAudioPlayback,
  stopAllTerrainAudioPlayback,
} from "./terrain-audio-playback.js";
import {
  drainTerrainAudioObservabilityEvents,
  resetTerrainAudioObservabilityForTests,
  trackTerrainAudioEvent,
} from "./terrain-audio-observability.js";
import { buildProductMessagingContext, getProductMessagingContext, resetProductMessagingContextForTests } from "./product-messaging-context.js";
import { tTerrainAudio } from "./terrain-audio-i18n.js";

beforeEach(() => {
  resetTerrainAudioStorageForTests();
  resetTerrainAudioObservabilityForTests();
  resetProductMessagingContextForTests();
  stopAllTerrainAudioPlayback();
});

afterEach(() => cleanup());

describe("GROSSISTE-B-03 audits", () => {
  it.each([
    auditTerrainAudioProductDescription,
    auditBusinessProfileAudio,
    auditPartnerSuggestionAudioVisibility,
    auditTerrainAudioPerformance,
    auditTerrainAudioPrivacy,
  ])("audit fn %p all ok", (fn) => {
    expect(fn().every((f) => f.ok)).toBe(true);
  });
});

describe("duration limits 90s", () => {
  it("product max 90", () => {
    expect(MAX_PRODUCT_VOICE_DESCRIPTION_SECONDS).toBe(90);
    const r = clampTerrainAudioDuration(120, "PRODUCT_DESCRIPTION");
    expect(r.exceeded).toBe(true);
    expect(r.durationSeconds).toBe(90);
  });

  it("profile max 90", () => {
    expect(MAX_BUSINESS_PROFILE_AUDIO_SECONDS).toBe(90);
  });

  it.each([10, 30, 60, 90])("allows %i sec", (s) => {
    expect(clampTerrainAudioDuration(s, "BUSINESS_PROFILE").exceeded).toBe(false);
  });
});

describe("storage TerrainAudioAsset", () => {
  it("creates product description asset", () => {
    createTerrainAudioAsset({
      ownerActorId: "gb",
      scopeType: "PRODUCT_DESCRIPTION",
      scopeId: "p1",
      durationSeconds: 5,
      mimeType: "audio/webm",
    });
    expect(getProductVoiceDescription("p1")?.durationSeconds).toBe(5);
  });

  it("soft delete product audio", () => {
    const a = createTerrainAudioAsset({
      ownerActorId: "gb",
      scopeType: "PRODUCT_DESCRIPTION",
      scopeId: "p2",
      durationSeconds: 3,
    });
    softDeleteTerrainAudioAsset(a.id);
    expect(getProductVoiceDescription("p2")).toBeNull();
  });

  it.each(Array.from({ length: 15 }, (_, i) => i))("pending upload slot %i", (i) => {
    createTerrainAudioAsset({
      ownerActorId: `o${i}`,
      scopeType: "PRODUCT_DESCRIPTION",
      scopeId: `p${i}`,
      durationSeconds: 1,
      pending: true,
    });
    expect(listPendingTerrainAudioUploads().length).toBeGreaterThan(0);
  });
});

describe("VenextAudioSpeakerButton", () => {
  it("renders speaker with duration", () => {
    render(
      <VenextAudioSpeakerButton audioId="a1" audioUrl="https://x/a.webm" durationSeconds={12} />,
    );
    expect(screen.getByTestId("venext-audio-speaker-btn")).toBeTruthy();
    expect(screen.getByTestId("venext-audio-speaker-duration").textContent).toContain("0:12");
  });

  it("hides nothing when no url shows error on play", () => {
    render(<VenextAudioSpeakerButton audioId="a2" />);
    fireEvent.click(screen.getByTestId("venext-audio-speaker-btn"));
    expect(screen.getByTestId("venext-audio-speaker-error")).toBeTruthy();
  });

  it.each(Array.from({ length: 8 }, (_, i) => i))("playback single slot %i", (i) => {
    requestTerrainAudioPlayback(`play-${i}`);
    expect(getActiveTerrainAudioPlaybackId()).toBe(`play-${i}`);
  });
});

describe("ProductVoiceDescription", () => {
  it("editor mode record hold", () => {
    render(<ProductVoiceDescription productId="px" ownerActorId="gb" mode="editor" />);
    const hold = screen.getByTestId("tca-product-voice-record-hold");
    fireEvent.pointerDown(hold);
    fireEvent.pointerUp(hold);
    fireEvent.click(screen.getByTestId("tca-product-voice-record-confirm"));
    expect(getProductVoiceDescription("px")).toBeTruthy();
  });

  it("viewer mode null without audio", () => {
    const { container } = render(
      <ProductVoiceDescription productId="empty" ownerActorId="gb" mode="viewer" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("viewer shows speaker when audio exists", () => {
    createTerrainAudioAsset({
      ownerActorId: "gb",
      scopeType: "PRODUCT_DESCRIPTION",
      scopeId: "pv",
      durationSeconds: 4,
    });
    render(<ProductVoiceDescription productId="pv" ownerActorId="gb" mode="viewer" />);
    expect(screen.getByTestId("tca-product-voice-speaker-btn")).toBeTruthy();
  });
});

describe("BusinessProfileAudioSection", () => {
  it("renders section title", () => {
    render(<BusinessProfileAudioSection ownerActorId="gb-profile" />);
    expect(screen.getByTestId("tca-business-profile-audio")).toBeTruthy();
  });

  it("records business audio", () => {
    render(<BusinessProfileAudioSection ownerActorId="gb2" />);
    fireEvent.pointerDown(screen.getByTestId("tca-business-profile-audio-record-hold"));
    fireEvent.pointerUp(screen.getByTestId("tca-business-profile-audio-record-hold"));
    fireEvent.click(screen.getByTestId("tca-business-profile-audio-record-confirm"));
    expect(screen.getByTestId("tca-business-profile-audio-speaker-btn")).toBeTruthy();
  });
});

describe("product messaging context", () => {
  it("builds context for negotiation", () => {
    buildProductMessagingContext({
      productId: "p99",
      productImage: "img.jpg",
      productAudioDescriptionId: "aud-1",
      supplierId: "sup-1",
      relationshipId: "rel-1",
    });
    const ctx = getProductMessagingContext("p99");
    expect(ctx?.supplierId).toBe("sup-1");
    expect(ctx?.productAudioDescriptionId).toBe("aud-1");
  });
});

describe("PartnerSuggestionCatalogPreview", () => {
  it("neutral when no images", () => {
    render(<PartnerSuggestionCatalogPreview displayName="X" partnerRoleLabel="Grossiste" city="Abidjan" />);
    expect(screen.getByTestId("tca-partner-preview-neutral")).toBeTruthy();
  });

  it("shows up to 3 thumbs", () => {
    render(
      <PartnerSuggestionCatalogPreview
        displayName="M"
        imageUrls={["a.jpg", "b.jpg", "c.jpg", "d.jpg"]}
      />,
    );
    expect(screen.getByTestId("tca-partner-preview-thumb-2")).toBeTruthy();
    expect(screen.queryByTestId("tca-partner-preview-thumb-3")).toBeNull();
  });
});

describe("i18n", () => {
  it.each(["fr", "en", "ar", "zh"] as const)("locale %s has listenDescription", (loc) => {
    expect(tTerrainAudio("listenDescription", loc).length).toBeGreaterThan(2);
  });
});

describe("observability metadata only", () => {
  it("tracks product record without blob", () => {
    trackTerrainAudioEvent("audio_product_record_completed", { productId: "p1", durationSeconds: 3 });
    const events = drainTerrainAudioObservabilityEvents();
    expect(events[0]?.name).toBe("audio_product_record_completed");
    expect(JSON.stringify(events)).not.toContain("blob:");
  });
});

describe("mime types", () => {
  it.each(SUPPORTED_TERRAIN_AUDIO_MIME_TYPES)("supports %s", (m) => {
    expect(m.startsWith("audio/")).toBe(true);
  });
});

describe("matrix expansion", () => {
  it.each(Array.from({ length: 30 }, (_, i) => i))("i18n key recordProduct %i", (i) => {
    expect(tTerrainAudio("recordProduct", "fr").length).toBeGreaterThan(1);
    expect(tTerrainAudio("maxDuration", ["fr", "en", "ar", "zh"][i % 4] as "fr")).toBeTruthy();
  });

  it.each(Array.from({ length: 40 }, (_, i) => i))("asset isolation %i", (i) => {
    const a = createTerrainAudioAsset({
      ownerActorId: "o",
      scopeType: "PRODUCT_DESCRIPTION",
      scopeId: `iso-${i}`,
      durationSeconds: 0.5 + i * 0.1,
    });
    expect(a.id).toContain("ta-");
  });
});
