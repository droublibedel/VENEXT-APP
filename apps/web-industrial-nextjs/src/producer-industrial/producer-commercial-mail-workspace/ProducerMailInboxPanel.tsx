"use client";

import { memo, useMemo, useRef, useState } from "react";

import type { ProducerMailThread } from "./producer-commercial-mail.types";

const ROW_HEIGHT = 72;
const VIEWPORT_ROWS = 10;

const VirtualMailRows = memo(function VirtualMailRows({
  threads,
  activeId,
  onSelect,
}: {
  threads: ProducerMailThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const { start, end, offset } = useMemo(() => {
    const startIdx = Math.floor(scrollTop / ROW_HEIGHT);
    const visible = Math.min(threads.length - startIdx, VIEWPORT_ROWS + 2);
    return { start: startIdx, end: startIdx + visible, offset: startIdx * ROW_HEIGHT };
  }, [scrollTop, threads.length]);

  const slice = threads.slice(start, end);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      data-testid="producer-mail-inbox-virtual-list"
    >
      <div style={{ height: threads.length * ROW_HEIGHT, position: "relative" }}>
        <ul className="absolute left-0 right-0" style={{ top: offset }}>
          {slice.map((thread) => (
            <li key={thread.id} style={{ height: ROW_HEIGHT }}>
              <button
                type="button"
                className={`flex h-full w-full flex-col border-b border-slate-800/60 px-3 py-2 text-left transition-colors ${
                  activeId === thread.id
                    ? "bg-emerald-500/10"
                    : "hover:bg-slate-900/60"
                } ${thread.unread ? "border-l-2 border-l-emerald-500/70" : ""}`}
                onClick={() => onSelect(thread.id)}
                data-testid={`mail-thread-row-${thread.id}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={`truncate text-[11px] ${thread.unread ? "font-semibold text-slate-100" : "text-slate-300"}`}
                  >
                    {thread.partnerName}
                  </span>
                  <span className="shrink-0 text-[9px] text-slate-500">{thread.at}</span>
                </div>
                <p className="truncate text-[11px] font-medium text-slate-200">{thread.subject}</p>
                <p className="truncate text-[10px] text-slate-500">{thread.preview}</p>
                <div className="mt-0.5 flex gap-2 text-[9px] text-slate-600">
                  {thread.hasAttachments ? <span>Pièce jointe</span> : null}
                  {thread.orderReference ? <span>· {thread.orderReference}</span> : null}
                  {thread.priority === "high" ? (
                    <span className="text-amber-400/90">Prioritaire</span>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});

export const ProducerMailInboxPanel = memo(function ProducerMailInboxPanel({
  threads,
  activeThreadId,
  onSelectThread,
  onCompose,
  composeVisible,
}: {
  threads: ProducerMailThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onCompose: () => void;
  composeVisible: boolean;
}) {
  return (
    <section
      className="flex h-full min-h-[420px] flex-col border-r border-slate-800/80 bg-slate-950/20"
      data-testid="producer-mail-inbox-panel"
    >
      <header className="flex items-center justify-between border-b border-slate-800/70 px-3 py-2">
        <h3 className="text-xs font-semibold text-slate-200">Messages</h3>
        {composeVisible ? (
          <button
            type="button"
            className="rounded border border-emerald-600/40 px-2 py-1 text-[10px] text-emerald-300 hover:bg-emerald-500/10"
            onClick={onCompose}
            data-testid="producer-mail-compose-open"
          >
            Nouveau mail
          </button>
        ) : null}
      </header>
      {threads.length === 0 ? (
        <p className="p-4 text-[11px] text-slate-500" data-testid="producer-mail-inbox-empty">
          Aucun message dans ce dossier.
        </p>
      ) : (
        <VirtualMailRows threads={threads} activeId={activeThreadId} onSelect={onSelectThread} />
      )}
    </section>
  );
});
