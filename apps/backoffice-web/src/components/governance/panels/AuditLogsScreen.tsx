"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchGovernanceJson } from "../../../lib/governance-api";
import { useGovernanceShell } from "../context/GovernanceShellContext";

type Log = {
  id: string;
  actor: string;
  action: string;
  target: string;
  source: string;
  createdAt: string;
  before: unknown;
  after: unknown;
};

export function AuditLogsScreen() {
  const { setSelection } = useGovernanceShell();
  const [filterInput, setFilterInput] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [logs, setLogs] = useState<Log[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPage = useCallback(
    async (cursor?: string, append?: boolean) => {
      setLoading(true);
      const q = new URLSearchParams({ limit: "35" });
      if (actionFilter.trim()) q.set("action", actionFilter.trim());
      if (cursor) q.set("cursor", cursor);
      const res = await fetchGovernanceJson<{ logs: Log[]; page: { nextCursor: string | null; hasMore: boolean } }>(
        `/audit-logs?${q}`,
      );
      setLoading(false);
      if (!res.ok || !res.data) return;
      setLogs((prev) => (append ? [...prev, ...res.data!.logs] : res.data!.logs));
      setNextCursor(res.data.page.nextCursor);
      setHasMore(res.data.page.hasMore);
    },
    [actionFilter],
  );

  useEffect(() => {
    void fetchPage(undefined, false);
  }, [fetchPage]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Audit & security logs</h2>
      <div className="flex flex-wrap gap-2">
        <input
          className="min-w-[240px] rounded border border-white/15 bg-black/40 px-2 py-1.5 text-[12px] text-white"
          placeholder="Action contains…"
          value={filterInput}
          onChange={(e) => setFilterInput(e.target.value)}
        />
        <button
          type="button"
          className="rounded border border-white/15 px-3 py-1.5 text-[12px] hover:bg-white/5"
          onClick={() => setActionFilter(filterInput.trim())}
        >
          Filter
        </button>
      </div>

      {loading && logs.length === 0 ? <p className="text-white/40">Loading audit trail…</p> : null}

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[900px] border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/45">
              <th className="px-2 py-2">Time</th>
              <th className="px-2 py-2">Actor</th>
              <th className="px-2 py-2">Action</th>
              <th className="px-2 py-2">Target</th>
              <th className="px-2 py-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr
                key={l.id}
                className="border-b border-white/[0.06] hover:bg-white/[0.03]"
                onMouseEnter={() => setSelection({ kind: "audit", id: l.id, payload: l })}
                role="presentation"
              >
                <td className="px-2 py-2 font-mono text-[10px] text-white/65">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-2 py-2">{l.actor}</td>
                <td className="px-2 py-2 font-mono">{l.action}</td>
                <td className="px-2 py-2 break-all">{l.target}</td>
                <td className="px-2 py-2">{l.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && nextCursor ? (
        <button
          type="button"
          disabled={loading}
          className="text-[12px] text-cyan-300 underline disabled:opacity-40"
          onClick={() => void fetchPage(nextCursor, true)}
        >
          {loading ? "Loading…" : "Older entries"}
        </button>
      ) : null}
    </div>
  );
}
