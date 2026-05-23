"use client";

import { useEffect, useMemo, useState } from "react";

import { DEMO_ACTOR, venextActorHeaders } from "./constants";
import { useMockConversationInsight } from "./MockConversationInsightProvider";
import { CommerceActionRail } from "./components/CommerceActionRail";
import { CommerceConversationLayout } from "./components/CommerceConversationLayout";
import { MessageVirtualizedList } from "./components/MessageVirtualizedList";
import { NegotiationStateCard } from "./components/NegotiationStateCard";
import { PersistentProductContextBar } from "./components/PersistentProductContextBar";
import { ConversationalOrderDraftStrip } from "./components/ConversationalOrderDraftStrip";
import { useCommerceContext } from "./hooks/useCommerceContext";
import { useCommerceRealtime } from "./hooks/useCommerceRealtime";
import { useConversationalOrderDraft } from "./hooks/useConversationalOrderDraft";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

type Props = { threadId: string };

export function CommerceThreadView({ threadId }: Props) {
  const { data, loading, error, reload } = useCommerceContext(threadId);
  const { insight, loading: insLoading, refresh } = useMockConversationInsight();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const { data: coDraft, loading: coLoading, error: coErr, reload: reloadDraft } = useConversationalOrderDraft(threadId);
  const { connected, lastTypingRemote, events, threadRealtimeAuthMode, wsThreadScopeValidated } = useCommerceRealtime(
    threadId,
    { typing, actor: DEMO_ACTOR },
  );

  useEffect(() => {
    void refresh(threadId);
  }, [refresh, threadId]);

  useEffect(() => {
    const hit = [...events]
      .reverse()
      .find(
        (e) =>
          "threadId" in e &&
          e.threadId === threadId &&
          (e.type === "draft.updated" ||
            e.type === "draft.ready" ||
            e.type === "draft.human_confirmed" ||
            e.type === "negotiation.accepted"),
      );
    if (hit) void reloadDraft();
  }, [events, threadId, reloadDraft]);

  const insightStrip = useMemo(() => {
    if (insLoading) return <p className="text-[10px] text-slate-500">Analyse mock…</p>;
    if (!insight) return null;
    return (
      <div className="grid gap-1 text-[10px] text-slate-300 md:grid-cols-3">
        <div>
          <p className="font-semibold text-cyan-200/80">Synthèse</p>
          <ul className="list-inside list-disc text-slate-400">
            {insight.summary.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-amber-200/80">Risques</p>
          <ul className="list-inside list-disc text-slate-400">
            {insight.risks.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-emerald-200/80">Pistes</p>
          <ul className="list-inside list-disc text-slate-400">
            {insight.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }, [insight, insLoading]);

  if (loading && !data) {
    return <VenextInlineSkeleton variant="messaging" className="p-4" />;
  }
  if (error || !data) {
    return <p className="p-4 text-sm text-rose-300">Erreur fil: {error ?? "inconnu"}</p>;
  }

  const sendText = async () => {
    const t = draft.trim();
    if (!t) return;
    setSending(true);
    try {
      const r = await fetch(`/api/core/v1/commerce-messaging/threads/${threadId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...venextActorHeaders(DEMO_ACTOR),
        },
        body: JSON.stringify({
          messageType: "TEXT",
          content: t,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      setDraft("");
      await reload();
      await reloadDraft();
    } finally {
      setSending(false);
    }
  };

  return (
    <CommerceConversationLayout
      contextBar={<PersistentProductContextBar context={data} />}
      insight={
        <div>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Assistance IA (mock)
            </p>
            <button
              type="button"
              className="text-[10px] text-cyan-400 hover:underline"
              onClick={() => void refresh(threadId)}
            >
              Rafraîchir
            </button>
          </div>
          {insightStrip}
        </div>
      }
      messages={
        <div className="flex min-h-0 flex-1 flex-col gap-2 md:flex-row">
          {data.negotiation ? (
            <div className="border-b border-slate-800 p-2 md:hidden">
              <NegotiationStateCard negotiation={data.negotiation} />
            </div>
          ) : null}
          {data.negotiation ? (
            <div className="hidden w-52 shrink-0 border-b border-slate-800 p-2 md:block md:border-b-0 md:border-r">
              <NegotiationStateCard negotiation={data.negotiation} />
            </div>
          ) : null}
          <MessageVirtualizedList messages={data.messages} viewerOrganizationId={DEMO_ACTOR.organizationId} />
        </div>
      }
      composer={
        <div className="flex flex-col gap-2">
          <ConversationalOrderDraftStrip
            threadId={threadId}
            snapshot={coDraft}
            loading={coLoading}
            error={coErr}
            onReload={reloadDraft}
          />
          <div className="flex items-center gap-2">
            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setTyping(true);
                window.setTimeout(() => setTyping(false), 800);
              }}
              rows={2}
              placeholder="Message opérationnel (texte)…"
              className="min-h-[44px] flex-1 resize-none rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[12px] text-slate-100 placeholder:text-slate-600"
            />
            <button
              type="button"
              disabled={sending}
              onClick={() => void sendText()}
              className="rounded border border-cyan-700/50 bg-cyan-950/40 px-3 py-2 text-[11px] font-medium text-cyan-50 hover:bg-cyan-950/70 disabled:opacity-40"
            >
              Envoyer
            </button>
          </div>
          <p className="text-[9px] text-slate-600">
            WebSocket commerce: {connected ? "connecté" : "hors ligne"} · mode{" "}
            <span className="font-mono">{threadRealtimeAuthMode ?? "…"}</span>
            {wsThreadScopeValidated === false ? (
              <> · périmètre fil non validé (mode ouvert / démo — pas une preuve d’accès)</>
            ) : wsThreadScopeValidated === true ? (
              <> · périmètre fil validé côté serveur</>
            ) : null}
            ·{" "}
            {lastTypingRemote && lastTypingRemote.type === "typing.indicator" && lastTypingRemote.active
              ? "Contrepartie en saisie…"
              : "Veille opérationnelle"}
          </p>
        </div>
      }
      rail={
        <CommerceActionRail
          threadId={threadId}
          negotiationId={data.negotiation?.id ?? null}
          onAfterAction={reload}
        />
      }
      footerMeta={
        <p className="text-[9px] text-slate-600">
          Fil {data.threadType} · acheteur {data.buyerOrganizationId?.slice(0, 8)}… · vendeur{" "}
          {data.sellerOrganizationId?.slice(0, 8)}…
        </p>
      }
    />
  );
}
