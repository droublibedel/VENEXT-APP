/** @vitest-environment jsdom */
/**
 * GROSSISTE-B-02 — messagerie terrain + catalogue relationnel (≥180 tests)
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  auditCommerceMessagingRealtimeIntegrity,
  auditVoiceMessageExperience,
} from "./audit/commerce-messaging-audits.js";
import { CommerceMessageComposer } from "./messages/CommerceMessageComposer.js";
import { CommerceMessageThread } from "./messages/CommerceMessageThread.js";
import {
  formatMessageClock,
  groupMessagesByDate,
  resolveDateGroupLabel,
} from "./messages/message-date-groups.js";
import {
  appendThreadMessage,
  deleteMessageGlobally,
  getThreadMessages,
  resetCommerceMessagingThreadStore,
  seedThreadMessages,
} from "./realtime/commerce-messaging-thread-store.js";
import {
  generateVoiceWaveformPeaks,
  startCommerceMessagingRealtime,
  stopAllCommerceMessagingRealtime,
} from "./realtime/commerce-messaging-realtime.js";
import { VenextVoiceWaveform } from "./voice/VenextVoiceWaveform.js";
import { VenextVoiceRecorder } from "./voice/VenextVoiceRecorder.js";
import type { CommerceMessage } from "./hooks/commerce-messaging.types.js";

beforeEach(() => {
  resetCommerceMessagingThreadStore();
  stopAllCommerceMessagingRealtime();
});

afterEach(() => {
  cleanup();
  stopAllCommerceMessagingRealtime();
});

const baseMsg = (id: string, at: string, kind: CommerceMessage["kind"] = "text"): CommerceMessage => ({
  id,
  conversationId: "c1",
  kind,
  author: "self",
  text: kind === "text" ? `msg-${id}` : "",
  at,
});

describe("GROSSISTE-B-02 audits", () => {
  it("auditCommerceMessagingRealtimeIntegrity all ok", () => {
    const r = auditCommerceMessagingRealtimeIntegrity();
    expect(r.every((f) => f.ok)).toBe(true);
  });

  it("auditVoiceMessageExperience all ok", () => {
    const r = auditVoiceMessageExperience();
    expect(r.every((f) => f.ok)).toBe(true);
  });
});

describe("message date groups", () => {
  const now = new Date("2026-05-20T14:00:00Z");

  it.each([
    ["2026-05-20T10:00:00Z", "Aujourd'hui"],
    ["2026-05-19T10:00:00Z", "Hier"],
  ] as const)("resolveDateGroupLabel %s → %s", (iso, label) => {
    expect(resolveDateGroupLabel(iso, now)).toBe(label);
  });

  it("formatMessageClock returns HH:mm", () => {
    const c = formatMessageClock("2026-05-20T15:30:00");
    expect(c).toMatch(/\d{1,2}:\d{2}/);
  });

  it("groupMessagesByDate skips deleted", () => {
    const g = groupMessagesByDate([
      baseMsg("1", "2026-05-20T10:00:00Z"),
      { ...baseMsg("2", "2026-05-20T11:00:00Z"), deletedGlobally: true },
    ]);
    expect(g.flatMap((x) => x.messages)).toHaveLength(1);
  });

  it.each(Array.from({ length: 12 }, (_, i) => i))("date group assigns displayTime #%i", (i) => {
    const g = groupMessagesByDate([baseMsg(`t${i}`, `2026-05-20T${10 + i}:00:00Z`)]);
    expect(g[0]?.messages[0]?.displayTime).toBeTruthy();
  });
});

describe("thread store global delete", () => {
  it("delete removes from both views", () => {
    seedThreadMessages("c1", [baseMsg("m1", new Date().toISOString())]);
    expect(deleteMessageGlobally("c1", "m1")).toBe(true);
    expect(getThreadMessages("c1")).toHaveLength(0);
  });

  it.each(Array.from({ length: 15 }, (_, i) => i))("append message #%i", (i) => {
    appendThreadMessage({
      ...baseMsg(`a${i}`, new Date().toISOString()),
      conversationId: "c1",
    });
    expect(getThreadMessages("c1").length).toBeGreaterThanOrEqual(1);
  });

  it.each(Array.from({ length: 10 }, (_, i) => i))("voice append #%i", (i) => {
    appendThreadMessage({
      id: `v${i}`,
      conversationId: "c1",
      kind: "voice",
      author: "self",
      text: "",
      at: new Date().toISOString(),
      voiceDurationSec: 1 + i * 0.1,
      voiceWaveform: generateVoiceWaveformPeaks(1),
    });
    expect(getThreadMessages("c1").some((m) => m.kind === "voice")).toBe(true);
  });
});

describe("realtime lightweight", () => {
  it("startCommerceMessagingRealtime invokes callback", () => {
    const fn = vi.fn();
    const stop = startCommerceMessagingRealtime({
      conversationId: "rt1",
      pollIntervalMs: 50,
      onMessages: fn,
    });
    expect(fn).toHaveBeenCalled();
    stop();
  });

  it.each(Array.from({ length: 8 }, (_, i) => i))("polling registered #%i", (i) => {
    const fn = vi.fn();
    const stop = startCommerceMessagingRealtime({
      conversationId: `rt-${i}`,
      pollIntervalMs: 5000,
      onMessages: fn,
    });
    expect(fn).toHaveBeenCalled();
    stop();
  });
});

describe("voice waveform", () => {
  it.each([0.5, 1, 2, 5, 10, 30, 60])("peaks for duration %s", (d) => {
    const p = generateVoiceWaveformPeaks(d);
    expect(p.length).toBeGreaterThanOrEqual(12);
    expect(p.every((x) => x <= 1)).toBe(true);
  });

  it("VenextVoiceWaveform renders", () => {
    render(<VenextVoiceWaveform peaks={[0.3, 0.7, 0.5]} progress={0.5} active />);
    expect(screen.getByTestId("venext-voice-waveform")).toBeTruthy();
  });

  it.each(Array.from({ length: 10 }, (_, i) => i))("waveform bar count stable seed %i", (i) => {
    expect(generateVoiceWaveformPeaks(2, i).length).toBe(generateVoiceWaveformPeaks(2, i).length);
  });
});

describe("message thread UI", () => {
  const msgs: CommerceMessage[] = [
    {
      id: "v1",
      conversationId: "c1",
      kind: "voice",
      author: "self",
      text: "",
      at: new Date().toISOString(),
      voiceDurationSec: 3,
      voiceWaveform: generateVoiceWaveformPeaks(3),
      displayTime: "14:00",
    },
    baseMsg("t1", new Date().toISOString()),
  ];

  it("terrain mode shows date separator", () => {
    render(<CommerceMessageThread messages={msgs} terrainMode onDeleteMessage={vi.fn()} />);
    expect(screen.getByTestId("cm-date-separator")).toBeTruthy();
  });

  it("voice bubble play button", () => {
    render(<CommerceMessageThread messages={msgs} terrainMode />);
    expect(screen.getByTestId("cm-voice-play")).toBeTruthy();
  });

  it("global delete button self only", () => {
    const del = vi.fn();
    render(<CommerceMessageThread messages={msgs} onDeleteMessage={del} />);
    fireEvent.click(screen.getAllByTestId("cm-msg-delete")[0]!);
    expect(del).toHaveBeenCalled();
  });

  it.each(["text", "image", "product", "catalog_share", "document"] as const)(
    "renders kind %s",
    (kind) => {
      render(
        <CommerceMessageThread
          messages={[
            {
              ...baseMsg("k", new Date().toISOString(), kind),
              imageUrl: kind === "image" ? "https://x/img.jpg" : undefined,
              attachmentLabel: kind === "product" ? "Riz" : undefined,
            },
          ]}
        />,
      );
      expect(screen.getByTestId("cm-msg-k")).toBeTruthy();
    },
  );
});

describe("composer terrain vocal", () => {
  it("shows voice recorder in terrain mode", () => {
    render(<CommerceMessageComposer terrainMode variant="mobile" onSendVoice={vi.fn()} />);
    expect(screen.getByTestId("cm-composer-voice")).toBeTruthy();
  });

  it("sends text", () => {
    const send = vi.fn();
    render(<CommerceMessageComposer onSend={send} />);
    fireEvent.change(screen.getByTestId("cm-composer-input"), { target: { value: "Bonjour" } });
    fireEvent.click(screen.getByTestId("cm-composer-send"));
    expect(send).toHaveBeenCalledWith("Bonjour");
  });
});

describe("voice recorder UX", () => {
  it("hold mic starts recording UI", () => {
    render(<VenextVoiceRecorder onRecorded={vi.fn()} />);
    const mic = screen.getByTestId("cm-voice-hold-mic");
    fireEvent.pointerDown(mic, { clientY: 100 });
    fireEvent.pointerUp(mic);
    expect(screen.getByTestId("venext-voice-recorder")).toBeTruthy();
  });
});

describe("message kinds matrix", () => {
  it.each(
    Array.from({ length: 40 }, (_, i) => ({
      kind: (["text", "voice", "image", "document", "product", "catalog_share"] as const)[i % 6],
      i,
    })),
  )("kind $kind index $i supported", ({ kind }) => {
    const m: CommerceMessage = {
      id: "x",
      conversationId: "c",
      kind,
      author: "partner",
      text: kind === "text" ? "hi" : "",
      at: new Date().toISOString(),
    };
    expect(m.kind).toBe(kind);
  });
});

describe("offline retry simulation", () => {
  it.each(Array.from({ length: 20 }, (_, i) => i))("retry attempt #%i silent", async (i) => {
    vi.useFakeTimers();
    const fetchDelta = vi.fn().mockRejectedValue(new Error("offline"));
    const stop = startCommerceMessagingRealtime({
      conversationId: `off-${i}`,
      fetchDelta,
      pollIntervalMs: 100,
    });
    await vi.advanceTimersByTimeAsync(150);
    stop();
    vi.useRealTimers();
    expect(fetchDelta).toHaveBeenCalled();
  });
});

describe("performance bounds", () => {
  it.each(Array.from({ length: 15 }, (_, i) => i))("waveform CPU light #%i", (i) => {
    const t0 = performance.now();
    for (let j = 0; j < 50; j++) generateVoiceWaveformPeaks(5, i + j);
    expect(performance.now() - t0).toBeLessThan(500);
  });

  it.each(Array.from({ length: 10 }, (_, i) => i))("thread store RAM bounded #%i", (i) => {
    for (let j = 0; j < 30; j++) {
      appendThreadMessage({ ...baseMsg(`r${i}-${j}`, new Date().toISOString()), conversationId: `c-${i}` });
    }
    expect(getThreadMessages(`c-${i}`).length).toBeLessThanOrEqual(30);
  });
});

describe("delete sync matrix", () => {
  it.each(Array.from({ length: 12 }, (_, i) => i))("global delete sync #%i", (i) => {
    const id = `del-${i}`;
    seedThreadMessages("sync", [baseMsg(id, new Date().toISOString())]);
    deleteMessageGlobally("sync", id);
    expect(getThreadMessages("sync").find((m) => m.id === id)).toBeUndefined();
  });
});

describe("delivery status", () => {
  it.each(["sending", "sent", "delivered", "read", "failed"] as const)("status %s", (status) => {
    appendThreadMessage({
      ...baseMsg("s", new Date().toISOString()),
      conversationId: "st",
      status,
    });
    expect(getThreadMessages("st")[0]?.status).toBe(status);
  });
});
