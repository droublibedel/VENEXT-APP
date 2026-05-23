import { memo, useMemo, useState } from "react";
import { buildCommerceLinkedContext, CommerceConversationCommerceContext } from "commerce-messaging";
import type { CommerceLinkedView } from "commerce-messaging";

import type { ProfessionalMailThreadSummary, ProfessionalPartner } from "./professional-commercial-network.types";

export const ProfessionalPartnerMailPanel = memo(function ProfessionalPartnerMailPanel({
  partner,
  threads,
  onOpenMail,
  linkedEnabled,
}: {
  partner: ProfessionalPartner | null;
  threads: ProfessionalMailThreadSummary[];
  onOpenMail?: (threadId: string) => void;
  linkedEnabled?: boolean;
}) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [linkedView, setLinkedView] = useState<CommerceLinkedView>("conversation");

  const partnerThreads = useMemo(
    () => (partner ? threads.filter((t) => t.partnerId === partner.id) : threads),
    [partner, threads],
  );

  const activeThread = partnerThreads.find((t) => t.id === activeThreadId) ?? partnerThreads[0] ?? null;

  const linkedContext = useMemo(() => {
    if (!activeThread || !partner) return null;
    return buildCommerceLinkedContext({
      conversationId: activeThread.id,
      partnerName: partner.companyName,
      partnerId: partner.id,
      city: partner.city,
      order: activeThread.orderReference
        ? {
            orderId: activeThread.orderReference,
            partner: partner.companyName,
            status: "En validation",
            preparation: "Planifiée",
            delivery: "À confirmer",
            amountLabel: activeThread.orderReference,
          }
        : null,
      settlement: activeThread.settlementReference
        ? {
            method: "bank-transfer",
            statusLabel: "Virement en attente",
            amountLabel: "—",
            reference: activeThread.settlementReference,
          }
        : null,
    });
  }, [activeThread, partner]);

  return (
    <section data-testid="pcn-mail-panel">
      <div className="pcn-card">
        <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>Boîte mail professionnelle liée</h3>
        <p style={{ margin: "0 0 10px", fontSize: 10, color: "#8a9bab" }}>
          Mail-first — pas de messagerie instantanée. Threads, commandes et règlements contextuels.
        </p>
        {partnerThreads.length === 0 ? (
          <p style={{ fontSize: 11, color: "#8a9bab" }} data-testid="pcn-mail-empty">
            Aucun mail lié pour ce partenaire.
          </p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {partnerThreads.map((t) => (
              <li key={t.id} style={{ marginBottom: 6 }}>
                <button
                  type="button"
                  className="pcn-partner-row"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setActiveThreadId(t.id);
                    onOpenMail?.(t.id);
                  }}
                  data-testid={`pcn-mail-thread-${t.id}`}
                >
                  <strong style={{ fontSize: 11 }}>{t.subject}</strong>
                  <span style={{ display: "block", fontSize: 10, color: "#8a9bab", marginTop: 2 }}>
                    {t.at} — {t.preview}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {linkedEnabled && linkedContext && activeThread ? (
        <div className="pcn-card" data-testid="pcn-mail-linked-commerce">
          <CommerceConversationCommerceContext
            context={linkedContext}
            activeView={linkedView}
            onViewChange={setLinkedView}
            timelineEnabled
            testId="pcn-linked-context"
          />
        </div>
      ) : null}
    </section>
  );
});
