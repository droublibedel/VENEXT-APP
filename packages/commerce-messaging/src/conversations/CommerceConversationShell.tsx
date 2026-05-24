import { memo, useMemo, useState } from "react";

import { CommerceConversationSidebar } from "../components/CommerceConversationSidebar";
import { CommerceGovernanceBadge } from "../governance/CommerceGovernanceBadge";
import { CommerceMessagingAccountSettingsPanel } from "../governance/CommerceMessagingAccountSettings";
import { CommerceOrderConversationContext } from "../governance/CommerceOrderConversationContext";
import { CommerceProductConversationSettingsCard } from "../governance/CommerceProductConversationSettings";
import {
  defaultCommerceAccountSettings,
  resolveConversationGovernance,
} from "../governance/commerce-conversation-governance";
import type { CommerceMessagingAccountSettings } from "../governance/commerce-conversation-governance.types";
import {
  buildCommercialFlowHints,
  buildCommerceHints,
  buildConversationModeHints,
  buildConversationSignals,
  buildLinkedCommerceSignals,
  buildNegotiationSignals,
  buildOrderHints,
  buildProductHints,
  buildSettlementConversationHints,
} from "../intelligence/commerce-messaging-intelligence";
import {
  buildCommerceLinkedContext,
  inferSettlementFromOrder,
} from "../linked-commerce/buildCommerceLinkedContext";
import type { CommerceLinkedView } from "../linked-commerce/commerce-linked-context.types";
import { CommerceConversationCommerceContext } from "../linked-commerce/CommerceConversationCommerceContext";
import type { ConversationCategory } from "../hooks/commerce-messaging.types";
import type { CommerceMessagingInjectedData } from "../hooks/commerce-messaging-injected.types";
import { useCommerceConversations } from "../hooks/useCommerceConversations";
import { useCommerceMessages } from "../hooks/useCommerceMessages";
import { useCommerceOrderContext } from "../hooks/useCommerceOrderContext";
import { useCommerceProductContext } from "../hooks/useCommerceProductContext";
import {
  mockCommerceAccountSettings,
  mockOrderConversationGovernance,
  mockProductConversationSettings,
  mockNetworkStrip,
} from "../mocks/commerce-messaging-mock-data";
import { CommerceNetworkActivityStrip } from "../network/CommerceNetworkActivityStrip";
import { CommerceOrderContextCard } from "../orders/CommerceOrderContextCard";
import { CommerceProductContextCard } from "../products/CommerceProductContextCard";
import { CommerceMessageComposer } from "../messages/CommerceMessageComposer";
import { CommerceMessageThread } from "../messages/CommerceMessageThread";
import { useCommerceMessagingThread } from "../hooks/useCommerceMessagingThread";

export type CommerceConversationShellProps = {
  enabled?: boolean;
  liveEnabled?: boolean;
  testId?: string;
  governanceEnabled?: boolean;
  /** Mobile: list/thread plein écran, navigation tactile. */
  layout?: "desktop" | "mobile";
  /** When set, skips internal BFF hooks and uses Grossiste / Producteur adapted data. */
  injected?: CommerceMessagingInjectedData;
  /** Instruction 20.66 — liaison commande / règlement (override injected flags). */
  linkedContextEnabled?: boolean;
  linkedTimelineEnabled?: boolean;
  /** Instruction 20.76 — navigation contextuelle inter-modules. */
  contextRouting?: import("../commercial-context-bridge").CommercialContextRoutingInput;
  /** GROSSISTE-B-02 — messagerie terrain (vocal, dates, suppression globale). */
  terrainMessaging?: boolean;
};

export const CommerceConversationShell = memo(function CommerceConversationShell({
  enabled = true,
  liveEnabled = false,
  testId = "commerce-messaging-shell",
  governanceEnabled = false,
  layout = "desktop",
  injected,
  linkedContextEnabled: linkedContextEnabledProp,
  linkedTimelineEnabled: linkedTimelineEnabledProp,
  contextRouting,
  terrainMessaging = false,
}: CommerceConversationShellProps) {
  const dataOpts = { enabled: enabled && !injected, liveEnabled };
  const internal = useCommerceConversations(dataOpts);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [linkedView, setLinkedView] = useState<CommerceLinkedView>("conversation");
  const [receiptConfirmed, setReceiptConfirmed] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ConversationCategory | "all">("all");
  const [localAccount, setLocalAccount] = useState<CommerceMessagingAccountSettings | null>(null);
  const isMobileLayout = layout === "mobile";

  const governanceOn = governanceEnabled || injected?.governanceEnabled === true;

  const conversations = injected?.conversations ?? internal.data ?? [];
  const loading = injected?.loading ?? internal.loading;
  const dataSource = injected?.dataSource ?? internal.dataSource;
  const fallbackUsed = injected?.fallbackUsed ?? internal.fallbackUsed;
  const refresh = injected?.onRefresh ?? internal.refresh;

  const accountSettings = useMemo(() => {
    if (localAccount) return localAccount;
    return (
      injected?.accountSettings ??
      (governanceOn ? mockCommerceAccountSettings() : defaultCommerceAccountSettings())
    );
  }, [localAccount, injected?.accountSettings, governanceOn]);

  const resolvedActiveId = activeId ?? conversations[0]?.id ?? null;

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === resolvedActiveId) ?? null,
    [conversations, resolvedActiveId],
  );

  const internalMessages = useCommerceMessages(
    injected ? null : resolvedActiveId,
    dataOpts,
  );
  const internalProduct = useCommerceProductContext(
    injected ? null : activeConv?.productName ? "pr1" : null,
    dataOpts,
  );
  const internalOrder = useCommerceOrderContext(
    injected ? null : activeConv?.linkedOrderId ?? null,
    dataOpts,
  );

  const seedMessages = useMemo(() => {
    if (injected && resolvedActiveId) return injected.getMessages(resolvedActiveId);
    return internalMessages.data ?? [];
  }, [injected, resolvedActiveId, internalMessages.data]);

  const terrainThread = useCommerceMessagingThread(
    terrainMessaging ? resolvedActiveId : null,
    {
      liveEnabled: liveEnabled || terrainMessaging,
      seed: terrainMessaging ? seedMessages : undefined,
    },
  );

  const messages = terrainMessaging ? terrainThread.messages : seedMessages;

  const productCtx = useMemo(() => {
    if (injected && resolvedActiveId) return injected.getProductContext(resolvedActiveId);
    return internalProduct.data;
  }, [injected, resolvedActiveId, internalProduct.data]);

  const orderCtx = useMemo(() => {
    if (injected && resolvedActiveId) return injected.getOrderContext(resolvedActiveId);
    return internalOrder.data;
  }, [injected, resolvedActiveId, internalOrder.data]);

  const networkStrip = useMemo(() => {
    if (injected && resolvedActiveId) return injected.getNetworkStrip(resolvedActiveId);
    return resolvedActiveId ? mockNetworkStrip(resolvedActiveId) : null;
  }, [injected, resolvedActiveId]);

  const productGovernanceSettings = useMemo(() => {
    if (!governanceOn || !resolvedActiveId) return null;
    if (injected?.getProductConversationSettings) {
      return injected.getProductConversationSettings(resolvedActiveId);
    }
    const productId = activeConv?.productId ?? productCtx?.productId ?? "pr1";
    return mockProductConversationSettings(productId);
  }, [governanceOn, resolvedActiveId, injected, activeConv?.productId, productCtx?.productId]);

  const orderGovernance = useMemo(() => {
    if (!governanceOn || !resolvedActiveId) return null;
    if (injected?.getOrderConversationGovernance) {
      return injected.getOrderConversationGovernance(resolvedActiveId);
    }
    const orderId = activeConv?.linkedOrderId ?? orderCtx?.orderId;
    return orderId ? mockOrderConversationGovernance(orderId) : null;
  }, [
    governanceOn,
    resolvedActiveId,
    injected,
    activeConv?.linkedOrderId,
    orderCtx?.orderId,
  ]);

  const activeGovernance = useMemo(() => {
    if (!governanceOn || !resolvedActiveId) return null;
    if (injected?.resolveConversationGovernance) {
      return injected.resolveConversationGovernance(resolvedActiveId);
    }
    return resolveConversationGovernance({
      account: accountSettings,
      product: productGovernanceSettings,
      order: orderGovernance,
      partnerId: activeConv?.partnerId,
      partnerAuthorized: activeConv?.partnerId
        ? accountSettings.authorizedPartnerIds.includes(activeConv.partnerId)
        : true,
    });
  }, [
    governanceOn,
    resolvedActiveId,
    injected,
    accountSettings,
    productGovernanceSettings,
    orderGovernance,
    activeConv?.partnerId,
  ]);

  const convHints = useMemo(() => buildConversationSignals(conversations), [conversations]);
  const msgHints = useMemo(() => buildCommerceHints(messages), [messages]);
  const productHints = useMemo(() => buildProductHints(productCtx), [productCtx]);
  const orderHints = useMemo(() => buildOrderHints(orderCtx), [orderCtx]);
  const modeHints = useMemo(
    () =>
      governanceOn && activeGovernance
        ? [
            ...buildConversationModeHints(activeGovernance.mode, {
              corridor: activeConv?.corridor,
              partnersOnly: accountSettings.partnersOnly,
            }),
            ...buildNegotiationSignals(activeGovernance.mode, productCtx),
          ]
        : [],
    [governanceOn, activeGovernance, activeConv?.corridor, accountSettings.partnersOnly, productCtx],
  );
  const extraHints = injected?.extraHints ?? [];

  const linkedContextOn =
    linkedContextEnabledProp ?? injected?.linkedContextEnabled ?? false;
  const linkedTimelineOn =
    linkedTimelineEnabledProp ?? injected?.linkedTimelineEnabled ?? false;

  const linkedContext = useMemo(() => {
    if (!linkedContextOn || !resolvedActiveId || !activeConv) return null;
    if (injected?.getLinkedContext) {
      return injected.getLinkedContext(resolvedActiveId);
    }
    const order = orderCtx;
    const settlement = inferSettlementFromOrder(order);
    return buildCommerceLinkedContext({
      conversationId: resolvedActiveId,
      partnerName: activeConv.partnerName,
      partnerId: activeConv.partnerId,
      city: activeConv.city,
      productName: activeConv.productName ?? productCtx?.name,
      order,
      settlement,
    });
  }, [
    linkedContextOn,
    resolvedActiveId,
    activeConv,
    injected,
    orderCtx,
    productCtx?.name,
  ]);

  const linkedHints = useMemo(
    () =>
      linkedContext
        ? [
            ...buildLinkedCommerceSignals(linkedContext),
            ...buildSettlementConversationHints(linkedContext),
            ...buildCommercialFlowHints(linkedContext),
          ]
        : [],
    [linkedContext],
  );

  const visibleConversations = useMemo(() => {
    if (!governanceOn || accountSettings.messagingEnabled) return conversations;
    return conversations.filter((c) => c.conversationMode !== "DISABLED");
  }, [governanceOn, accountSettings.messagingEnabled, conversations]);

  const handleAccountChange = (next: CommerceMessagingAccountSettings) => {
    setLocalAccount(next);
    injected?.onAccountSettingsChange?.(next);
  };

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setLinkedView("conversation");
    setReceiptConfirmed(false);
    if (isMobileLayout) setMobileView("thread");
  };

  const handleMobileBack = () => {
    setMobileView("list");
  };

  const showSidebar = !isMobileLayout || mobileView === "list";
  const showThread = !isMobileLayout || mobileView === "thread";

  if (!enabled) {
    return (
      <div className="cm-shell" data-testid="commerce-messaging-disabled" style={{ padding: 24 }}>
        <p style={{ color: "#526059" }}>Messagerie commerciale — bientôt disponible.</p>
      </div>
    );
  }

  return (
    <div
      className={`cm-shell${isMobileLayout ? " cm-shell--mobile" : ""}`}
      data-testid={testId}
      data-layout={layout}
      data-mobile-view={isMobileLayout ? mobileView : undefined}
    >
      {showSidebar ? (
        <CommerceConversationSidebar
        conversations={visibleConversations}
        activeId={resolvedActiveId}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        onSelect={handleSelectConversation}
        dataSource={dataSource}
        fallbackUsed={fallbackUsed}
        loading={loading}
        governanceEnabled={governanceOn}
        compact={isMobileLayout}
        getGovernanceMode={(id) => {
          if (injected?.resolveConversationGovernance) {
            return injected.resolveConversationGovernance(id).mode;
          }
          const conv = conversations.find((c) => c.id === id);
          return conv?.conversationMode;
        }}
      />
      ) : null}
      {showThread ? (
      <div className="cm-main">
        {governanceOn && !isMobileLayout ? (
          <CommerceMessagingAccountSettingsPanel
            settings={accountSettings}
            onChange={handleAccountChange}
          />
        ) : null}
        {activeConv ? (
          <>
            <header style={{ padding: "12px 16px", borderBottom: "1px solid rgba(0,168,132,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                {isMobileLayout ? (
                  <button
                    type="button"
                    data-testid="cm-mobile-back"
                    onClick={handleMobileBack}
                    style={{
                      minHeight: 44,
                      minWidth: 44,
                      marginRight: 4,
                      fontSize: 18,
                      color: "#00a884",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    aria-label="Retour aux conversations"
                  >
                    ←
                  </button>
                ) : null}
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{activeConv.partnerName}</h2>
                {activeGovernance ? (
                  <CommerceGovernanceBadge
                    mode={activeGovernance.mode}
                    testId="cm-conversation-governance-badge"
                  />
                ) : null}
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#526059" }}>
                {activeConv.partnerRole} · {activeConv.city}
                {activeConv.corridor ? ` · ${activeConv.corridor}` : ""}
              </p>
              <button
                type="button"
                data-testid="cm-refresh"
                onClick={refresh}
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "#00a884",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Actualiser
              </button>
            </header>
            {governanceOn ? (
              <CommerceOrderConversationContext
                order={orderGovernance}
                governance={activeGovernance}
              />
            ) : null}
            <CommerceNetworkActivityStrip strip={networkStrip} />
            {[...convHints, ...msgHints, ...productHints, ...orderHints, ...modeHints, ...linkedHints, ...extraHints]
              .slice(0, 4)
              .map((h) => (
                <p key={h.id} className="cm-hint" data-testid="cm-intelligence-hint">
                  {h.text}
                </p>
              ))}
            {linkedContextOn && linkedContext ? (
              <CommerceConversationCommerceContext
                context={{
                  ...linkedContext,
                  settlement: receiptConfirmed && linkedContext.settlement
                    ? {
                        ...linkedContext.settlement,
                        statusLabel: "Réglé — réception confirmée",
                        partnerConfirmed: true,
                      }
                    : linkedContext.settlement,
                }}
                activeView={linkedView}
                onViewChange={setLinkedView}
                contextRouting={contextRouting}
                timelineEnabled={linkedTimelineOn}
                variant={isMobileLayout ? "mobile" : "default"}
                onConfirmReceipt={() => {
                  setReceiptConfirmed(true);
                  if (resolvedActiveId) {
                    injected?.onLinkedConfirmReceipt?.(resolvedActiveId);
                  }
                }}
              />
            ) : null}
            <CommerceProductConversationSettingsCard
              settings={productGovernanceSettings}
              productName={productCtx?.name}
            />
            <CommerceProductContextCard context={productCtx} />
            <CommerceOrderContextCard context={orderCtx} />
            <CommerceMessageThread
              messages={messages}
              terrainMode={terrainMessaging}
              onDeleteMessage={terrainMessaging ? terrainThread.removeMessage : undefined}
            />
            <CommerceMessageComposer
              governance={governanceOn ? activeGovernance : null}
              quickSuggestions={injected?.quickSuggestions}
              variant={isMobileLayout ? "mobile" : "default"}
              terrainMode={terrainMessaging}
              onSend={terrainMessaging ? (t) => terrainThread.sendText(t) : undefined}
              onSendVoice={
                terrainMessaging
                  ? (r) => terrainThread.sendVoice(r.durationSec, r.waveform)
                  : undefined
              }
            />
          </>
        ) : (
          <p style={{ padding: 24, color: "#526059" }}>
            {isMobileLayout ? "Choisissez une conversation dans la liste." : "Sélectionnez une conversation."}
          </p>
        )}
      </div>
      ) : null}
    </div>
  );
});
