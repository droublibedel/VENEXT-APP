"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { CommerceMessage } from "../types";
import { CartConversionEventCard } from "./CartConversionEventCard";
import { ProposalBubble } from "./ProposalBubble";
import { SystemEventBubble } from "./SystemEventBubble";
import { VoiceMessageBubble } from "./VoiceMessageBubble";

type Props = {
  messages: CommerceMessage[];
  viewerOrganizationId: string;
};

const EST_ROW = 88;
const OVERSCAN = 6;

/**
 * Incremental window over ascending timeline — lightweight on 2–3GB RAM devices (Instruction 7 §15).
 */
export function MessageVirtualizedList({ messages, viewerOrganizationId }: Props) {
  const asc = useMemo(() => [...messages].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)), [messages]);
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setTop(el.scrollTop);
  }, []);

  const totalH = Math.max(asc.length * EST_ROW, 320);
  const start = Math.max(0, Math.floor(top / EST_ROW) - OVERSCAN);
  const end = Math.min(asc.length, Math.ceil((top + (ref.current?.clientHeight ?? 400)) / EST_ROW) + OVERSCAN);
  const slice = asc.slice(start, end);
  const offsetY = start * EST_ROW;

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div style={{ height: totalH, position: "relative" }}>
        <div
          className="absolute left-0 right-0 flex w-full flex-col gap-2"
          style={{ transform: `translateY(${offsetY}px)` }}
        >
          {slice.map((m) => (
            <div key={m.id} style={{ minHeight: EST_ROW }}>
              <MessageRow m={m} mine={m.senderOrganizationId === viewerOrganizationId} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageRow({ m, mine }: { m: CommerceMessage; mine: boolean }) {
  const align = mine ? "items-end" : "items-start";

  if (m.messageType === "SYSTEM_EVENT") {
    return (
      <div className={`flex w-full flex-col ${align}`}>
        <SystemEventBubble content={m.content} structuredEvent={m.structuredEvent} />
        <Meta m={m} />
      </div>
    );
  }

  if (m.messageType === "CART_CONVERSION_EVENT") {
    return (
      <div className={`flex w-full flex-col ${align}`}>
        <CartConversionEventCard content={m.content} structuredEvent={m.structuredEvent} />
        <Meta m={m} />
      </div>
    );
  }

  if (
    m.messageType === "PRICE_PROPOSAL" ||
    m.messageType === "QUANTITY_PROPOSAL" ||
    m.messageType === "PAYMENT_PROPOSAL" ||
    m.messageType === "DELIVERY_PROPOSAL"
  ) {
    return (
      <div className={`flex w-full flex-col ${align}`}>
        <ProposalBubble
          mine={mine}
          messageType={m.messageType}
          content={m.content}
          structuredEvent={m.structuredEvent}
        />
        <Meta m={m} />
      </div>
    );
  }

  if (m.messageType === "VOICE") {
    return (
      <div className={`flex w-full flex-col ${align}`}>
        <VoiceMessageBubble mine={mine} voiceUrl={m.voiceUrl} />
        <Meta m={m} />
      </div>
    );
  }

  if (m.messageType === "ACCEPTANCE_EVENT" || m.messageType === "REJECTION_EVENT") {
    return (
      <div className={`flex w-full flex-col ${align}`}>
        <div
          className={`max-w-[min(100%,22rem)] rounded-lg border px-3 py-2 text-[11px] ${
            m.messageType === "ACCEPTANCE_EVENT"
              ? "border-emerald-600/40 bg-emerald-950/35 text-emerald-50"
              : "border-rose-600/40 bg-rose-950/30 text-rose-50"
          }`}
        >
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            {m.messageType === "ACCEPTANCE_EVENT" ? "Acceptation" : "Refus"}
          </p>
          {m.content ? <p className="mt-1">{m.content}</p> : null}
        </div>
        <Meta m={m} />
      </div>
    );
  }

  return (
    <div className={`flex w-full flex-col ${align}`}>
      <div
        className={`max-w-[min(100%,26rem)] rounded-lg border px-3 py-2 text-[12px] leading-snug ${
          mine ? "border-cyan-800/50 bg-cyan-950/25 text-cyan-50" : "border-slate-700 bg-slate-900/85 text-slate-100"
        }`}
      >
        {m.content}
        {m.mediaUrls?.length ? (
          <p className="mt-1 font-mono text-[10px] text-slate-400">{m.mediaUrls.join(" · ")}</p>
        ) : null}
      </div>
      <Meta m={m} />
    </div>
  );
}

function Meta({ m }: { m: CommerceMessage }) {
  return (
    <span className="mt-0.5 font-mono text-[9px] text-slate-600">
      {new Date(m.createdAt).toLocaleString()} · {m.deliveryState}
    </span>
  );
}
