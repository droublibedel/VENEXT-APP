"use client";

import { useCallback, useEffect, useState } from "react";

import { ConversationalOrderDraftResponseSchema } from "@venext/shared-contracts";

import {
  humanizeIndustrialCaught,
  readHumanizedHttpFailure,
} from "@/errors/industrial-humanized-feedback";

import { DEMO_ACTOR, venextActorHeaders } from "../constants";

export function useConversationalOrderDraft(threadId: string | null) {
  const [data, setData] = useState<ReturnType<typeof ConversationalOrderDraftResponseSchema.parse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/core/v1/commerce-messaging/threads/${threadId}/conversational-order-draft`, {
        headers: venextActorHeaders(DEMO_ACTOR),
      });
      if (!r.ok) throw await readHumanizedHttpFailure(r);
      const json: unknown = await r.json();
      const parsed = ConversationalOrderDraftResponseSchema.safeParse(json);
      if (!parsed.success) throw new Error("draft_contract_mismatch");
      setData(parsed.data);
    } catch (e) {
      setError(humanizeIndustrialCaught(e, { fallbackKey: "message_not_sent" }));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
