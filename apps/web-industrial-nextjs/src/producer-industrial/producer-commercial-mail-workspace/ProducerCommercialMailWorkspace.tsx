"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { CommerceConversationCommerceContext } from "commerce-messaging";
import type { CommerceLinkedView } from "commerce-messaging";
import "commerce-messaging/styles.css";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";
import { ProducerCommercialMailSidebar } from "./ProducerCommercialMailSidebar";
import { ProducerMailActivityPanel } from "./ProducerMailActivityPanel";
import { ProducerMailComposePanel } from "./ProducerMailComposePanel";
import { ProducerMailInboxPanel } from "./ProducerMailInboxPanel";
import { ProducerMailInsightsPanel } from "./ProducerMailInsightsPanel";
import { ProducerMailOrdersPanel } from "./ProducerMailOrdersPanel";
import { ProducerMailSettlementsPanel } from "./ProducerMailSettlementsPanel";
import { ProducerMailThreadPanel } from "./ProducerMailThreadPanel";
import { resolveProducerMailGovernance } from "./producer-commercial-mail-governance";
import { filterThreadsByFolder } from "./producer-commercial-mail.viewmodel";
import type { ProducerMailFolderId, ProducerMailThread } from "./producer-commercial-mail.types";
import { useProducerCommercialMailData } from "./useProducerCommercialMailData";

type MailContextTab = "mail" | "linked";

function MailWorkspaceInner() {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const mailFlagOn = hydrated && flags.producer_commercial_mail_enabled !== false;
  const governance = useMemo(() => resolveProducerMailGovernance(flags), [flags]);
  const linkedEnabled = flags.commerce_linked_context_enabled !== false;

  const { view, loading, error, dataSource, fallbackUsed, refresh } =
    useProducerCommercialMailData(mailFlagOn && governance.mode !== "MAIL_DISABLED");

  const [activeFolder, setActiveFolder] = useState<ProducerMailFolderId>("inbox");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyThread, setReplyThread] = useState<ProducerMailThread | null>(null);
  const [contextTab, setContextTab] = useState<MailContextTab>("mail");
  const [linkedView, setLinkedView] = useState<CommerceLinkedView>("conversation");

  const folderCounts = useMemo(() => {
    if (!view) return {};
    const counts: Partial<Record<ProducerMailFolderId, number>> = {};
    const folders: ProducerMailFolderId[] = [
      "inbox",
      "sent",
      "drafts",
      "archived",
      "priority",
      "network",
      "orders",
      "settlements",
      "documents",
    ];
    for (const f of folders) {
      counts[f] = filterThreadsByFolder(view.threads, f).length;
    }
    return counts;
  }, [view]);

  const folderThreads = useMemo(() => {
    if (!view) return [];
    return filterThreadsByFolder(view.threads, activeFolder);
  }, [view, activeFolder]);

  const activeThread = useMemo(() => {
    if (!view || !activeThreadId) return null;
    return view.threads.find((t) => t.id === activeThreadId) ?? null;
  }, [view, activeThreadId]);

  const handleSelectThread = useCallback((id: string) => {
    setActiveThreadId(id);
    setContextTab("mail");
    setLinkedView("conversation");
  }, []);

  const handleReply = useCallback(() => {
    if (!activeThread) return;
    setReplyThread(activeThread);
    setComposeOpen(true);
  }, [activeThread]);

  if (!mailFlagOn || governance.mode === "MAIL_DISABLED") {
    return (
      <section
        className="producer-industrial-card p-6 text-sm text-slate-400"
        data-testid="producer-commercial-mail-disabled"
      >
        {governance.notice ?? "La boîte mail réseau commercial n'est pas activée pour cet environnement."}
      </section>
    );
  }

  return (
    <section data-testid="producer-commercial-mail-workspace" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ProducerSectionHeader
          kicker="Boîte Mail Réseau"
          title="Échanges commerciaux professionnels"
          subtitle="Mails structurés, documents, commandes et règlements — pas de messagerie instantanée."
        />
        <button
          type="button"
          onClick={refresh}
          className="rounded border border-slate-700/80 px-3 py-1.5 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300"
          data-testid="producer-mail-refresh"
        >
          Actualiser
        </button>
      </div>

      <ProducerDataSourceHint dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />

      {error ? (
        <p className="text-[11px] text-amber-400/90" data-testid="producer-mail-error">
          {error}
        </p>
      ) : null}

      <div className="relative grid min-h-[520px] overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950/30 lg:grid-cols-[200px_280px_1fr_240px]">
        <ProducerCommercialMailSidebar
          activeFolder={activeFolder}
          onFolderChange={(f) => {
            setActiveFolder(f);
            setActiveThreadId(null);
          }}
          counts={folderCounts}
        />

        <ProducerMailInboxPanel
          threads={folderThreads}
          activeThreadId={activeThreadId}
          onSelectThread={handleSelectThread}
          onCompose={() => {
            setReplyThread(null);
            setComposeOpen(true);
          }}
          composeVisible={governance.composeVisible}
        />

        <div className="relative flex min-h-0 flex-col border-r border-slate-800/80">
          <nav className="flex border-b border-slate-800/70 text-[10px]" aria-label="Vue message">
            <button
              type="button"
              className={`px-3 py-2 ${contextTab === "mail" ? "text-emerald-300" : "text-slate-500"}`}
              onClick={() => setContextTab("mail")}
              data-testid="mail-tab-message"
            >
              Message
            </button>
            {linkedEnabled && activeThread?.linkedContext ? (
              <button
                type="button"
                className={`px-3 py-2 ${contextTab === "linked" ? "text-emerald-300" : "text-slate-500"}`}
                onClick={() => setContextTab("linked")}
                data-testid="mail-tab-linked-commerce"
              >
                Contexte lié
              </button>
            ) : null}
          </nav>

          {contextTab === "mail" ? (
            <ProducerMailThreadPanel thread={activeThread} onReply={handleReply} />
          ) : activeThread?.linkedContext ? (
            <div className="flex-1 overflow-y-auto p-3" data-testid="producer-mail-linked-commerce">
              <CommerceConversationCommerceContext
                context={activeThread.linkedContext}
                activeView={linkedView}
                onViewChange={setLinkedView}
                timelineEnabled={flags.commerce_linked_timeline_enabled !== false}
                variant="default"
                testId="producer-mail-linked-context"
              />
            </div>
          ) : null}

          <ProducerMailComposePanel
            open={composeOpen}
            onClose={() => {
              setComposeOpen(false);
              setReplyThread(null);
            }}
            view={view}
            governance={governance}
            replyThread={replyThread}
          />
        </div>

        <aside className="hidden space-y-2 overflow-y-auto p-2 lg:block" data-testid="producer-mail-context-rail">
          <ProducerMailInsightsPanel view={view} />
          <ProducerMailActivityPanel view={view} />
          <ProducerMailOrdersPanel view={view} activeOrderId={activeThread?.orderId} />
          <ProducerMailSettlementsPanel view={view} />
        </aside>
      </div>
    </section>
  );
}

export const ProducerCommercialMailWorkspace = memo(function ProducerCommercialMailWorkspace() {
  return <MailWorkspaceInner />;
});
