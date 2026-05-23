import {
  deleteMessageGlobally,
  getThreadMessages,
  resetCommerceMessagingThreadStore,
  seedThreadMessages,
} from "../realtime/commerce-messaging-thread-store.js";
import { generateVoiceWaveformPeaks } from "../realtime/commerce-messaging-realtime.js";
import { groupMessagesByDate } from "../messages/message-date-groups.js";

export type AuditFinding = { code: string; ok: boolean; detail?: string };

export function auditCommerceMessagingRealtimeIntegrity(): AuditFinding[] {
  resetCommerceMessagingThreadStore();
  const cid = "audit-conv";
  seedThreadMessages(cid, [
    {
      id: "a1",
      conversationId: cid,
      kind: "text",
      author: "self",
      text: "test",
      at: new Date().toISOString(),
    },
  ]);
  const findings: AuditFinding[] = [
    {
      code: "THREAD_STORE_SEED",
      ok: getThreadMessages(cid).length === 1,
    },
    {
      code: "GLOBAL_DELETE_REMOVES_FROM_VIEW",
      ok: (() => {
        deleteMessageGlobally(cid, "a1");
        return getThreadMessages(cid).length === 0;
      })(),
    },
    {
      code: "DATE_GROUPS_SKIP_DELETED",
      ok: (() => {
        seedThreadMessages(cid, [
          {
            id: "b1",
            conversationId: cid,
            kind: "text",
            author: "self",
            text: "x",
            at: new Date().toISOString(),
            deletedGlobally: true,
          },
          {
            id: "b2",
            conversationId: cid,
            kind: "text",
            author: "partner",
            text: "y",
            at: new Date().toISOString(),
          },
        ]);
        const g = groupMessagesByDate(getThreadMessages(cid));
        return g.every((gr) => gr.messages.every((m) => !m.deletedGlobally));
      })(),
    },
  ];
  resetCommerceMessagingThreadStore();
  return findings;
}

export function auditVoiceMessageExperience(): AuditFinding[] {
  const peaks = generateVoiceWaveformPeaks(3.5, 7);
  return [
    {
      code: "WAVEFORM_PEAK_COUNT_BOUNDED",
      ok: peaks.length >= 12 && peaks.length <= 48,
    },
    {
      code: "WAVEFORM_PEAKS_NORMALIZED",
      ok: peaks.every((p) => p >= 0.1 && p <= 1),
    },
    {
      code: "WAVEFORM_DETERMINISTIC_SEED",
      ok:
        JSON.stringify(generateVoiceWaveformPeaks(2, 1)) ===
        JSON.stringify(generateVoiceWaveformPeaks(2, 1)),
    },
  ];
}
