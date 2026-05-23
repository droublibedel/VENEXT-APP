"use client";

import type { ReactNode } from "react";

type Props = {
  contextBar: ReactNode;
  insight?: ReactNode;
  messages: ReactNode;
  composer: ReactNode;
  rail: ReactNode;
  footerMeta?: ReactNode;
};

/**
 * Commerce-native shell — contextual rail, no chat-app chrome (Instruction 7 §14).
 */
export function CommerceConversationLayout({
  contextBar,
  insight,
  messages,
  composer,
  rail,
  footerMeta,
}: Props) {
  return (
    <div className="flex min-h-[70dvh] flex-col border border-slate-800/80 bg-black/20 md:min-h-[calc(100dvh-6rem)] md:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {contextBar}
        {insight ? <div className="border-b border-slate-800/60 bg-slate-950/50 px-2 py-2">{insight}</div> : null}
        {messages}
        <div className="border-t border-slate-800/80 bg-slate-950/90 p-2">{composer}</div>
        {footerMeta ? <div className="border-t border-slate-900 px-2 py-1">{footerMeta}</div> : null}
      </div>
      {rail}
    </div>
  );
}
