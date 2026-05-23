"use client";

import { useCallback, useEffect, useState } from "react";

import { pilotageFetch } from "@/lib/pilotage-api";
import {
  assertBackofficeDataResolved,
  normalizeBackofficeEnvelope,
  type BackofficeLightweightEnvelope,
  type BackofficeResolvedState,
} from "@/pilotage/lib/envelope";

export type PilotageListState<T> = {
  status: BackofficeResolvedState;
  payload: T[];
  envelope: BackofficeLightweightEnvelope<T>;
  error?: string;
};

export function usePilotageList<T>(
  path: string | null,
  deps: unknown[] = [],
): PilotageListState<T> & { reload: () => void } {
  const [state, setState] = useState<PilotageListState<T>>({
    status: "loading",
    payload: [],
    envelope: normalizeBackofficeEnvelope<T>({}),
  });

  const reload = useCallback(() => {
    if (!path) {
      setState({
        status: "empty",
        payload: [],
        envelope: normalizeBackofficeEnvelope<T>({}),
      });
      return;
    }
    setState((s) => ({ ...s, status: "loading" }));
    pilotageFetch<unknown>(path)
      .then((raw) => {
        const envelope = normalizeBackofficeEnvelope<T>(raw);
        const resolved = assertBackofficeDataResolved(envelope, "ready");
        setState({
          status: resolved.state,
          payload: envelope.payload,
          envelope,
        });
      })
      .catch(() => {
        const envelope = normalizeBackofficeEnvelope<T>({});
        setState({
          status: "error",
          payload: [],
          envelope,
          error: "Impossible de charger les données. Le service est peut-être indisponible.",
        });
      });
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload, ...deps]);

  return { ...state, reload };
}

export function usePilotageDetail<T>(path: string | null): {
  status: BackofficeResolvedState;
  data: T | null;
  error?: string;
  reload: () => void;
} {
  const [status, setStatus] = useState<BackofficeResolvedState>("loading");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | undefined>();

  const reload = useCallback(() => {
    if (!path) return;
    setStatus("loading");
    pilotageFetch<T>(path)
      .then((row) => {
        setData(row);
        setStatus(row ? "ready" : "empty");
      })
      .catch(() => {
        setData(null);
        setStatus("error");
        setError("Fiche introuvable ou service indisponible.");
      });
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { status, data, error, reload };
}
