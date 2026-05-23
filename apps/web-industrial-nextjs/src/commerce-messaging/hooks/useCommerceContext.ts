"use client";

import { useCallback, useEffect, useState } from "react";

import type { CommerceContextResponse } from "../types";

import {
  humanizeIndustrialCaught,
  readHumanizedHttpFailure,
} from "@/errors/industrial-humanized-feedback";

import { DEMO_ACTOR, venextActorHeaders } from "../constants";

export function useCommerceContext(threadId: string | null) {
  const [data, setData] = useState<CommerceContextResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/core/v1/commerce-messaging/threads/${threadId}/commerce-context`, {
        headers: venextActorHeaders(DEMO_ACTOR),
      });
      if (!r.ok) throw await readHumanizedHttpFailure(r);
      const json = (await r.json()) as CommerceContextResponse;
      setData(json);
    } catch (e) {
      setError(humanizeIndustrialCaught(e, { fallbackKey: "message_not_sent" }));
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
