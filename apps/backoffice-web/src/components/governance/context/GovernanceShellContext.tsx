"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { fetchGovernanceJson } from "../../../lib/governance-api";

export type GovernanceSelection =
  | { kind: "feature"; key: string; payload?: unknown }
  | { kind: "organization"; id: string; payload?: unknown }
  | { kind: "relationship"; id: string; payload?: unknown }
  | { kind: "sponsored"; id: string; payload?: unknown }
  | { kind: "audit"; id: string; payload?: unknown }
  | { kind: "finding"; code: string; payload?: unknown }
  | null;

type ShellCtx = {
  selection: GovernanceSelection;
  setSelection: (s: GovernanceSelection) => void;
  overview: unknown | null;
  setOverview: (o: unknown | null) => void;
  lastRefresh: Date | null;
  refreshOverview: () => Promise<void>;
  degraded: boolean;
  setDegraded: (v: boolean) => void;
};

const Ctx = createContext<ShellCtx | null>(null);

export function GovernanceShellProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<GovernanceSelection>(null);
  const [overview, setOverview] = useState<unknown | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [degraded, setDegraded] = useState(false);

  const refreshOverview = useCallback(async () => {
    const res = await fetchGovernanceJson<unknown>("/overview");
    setDegraded(Boolean(res.degraded) || !res.ok);
    if (res.ok && res.data) {
      setOverview(res.data);
      setLastRefresh(new Date());
    }
  }, []);

  const v = useMemo(
    () =>
      ({
        selection,
        setSelection,
        overview,
        setOverview,
        lastRefresh,
        refreshOverview,
        degraded,
        setDegraded,
      }) satisfies ShellCtx,
    [selection, overview, lastRefresh, refreshOverview, degraded],
  );

  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useGovernanceShell() {
  const x = useContext(Ctx);
  if (!x) throw new Error("GovernanceShellProvider missing");
  return x;
}
