"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { CommerceThreadView } from "@/commerce-messaging/CommerceThreadView";
import { MockConversationInsightProvider } from "@/commerce-messaging/MockConversationInsightProvider";

export default function CommerceThreadPage() {
  const p = useParams();
  const threadId = typeof p.threadId === "string" ? p.threadId : "";

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800/80 px-3 py-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <Link href="/commerce-messaging" className="text-[11px] text-cyan-400 hover:underline">
            ← Hub fils
          </Link>
          <span className="font-mono text-[10px] text-slate-500">{threadId}</span>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-2 py-3">
        <MockConversationInsightProvider>
          <CommerceThreadView threadId={threadId} />
        </MockConversationInsightProvider>
      </div>
    </div>
  );
}
