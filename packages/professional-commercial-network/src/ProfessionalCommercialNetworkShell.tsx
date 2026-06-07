"use client";

import { memo, useMemo, useState } from "react";

import { ProfessionalCommercialAgreementsPanel } from "./ProfessionalCommercialAgreementsPanel";
import { ProfessionalPartnerActivityPanel } from "./ProfessionalPartnerActivityPanel";
import { ProfessionalPartnerDirectory } from "./ProfessionalPartnerDirectory";
import { ProfessionalPartnerDocumentsPanel } from "./ProfessionalPartnerDocumentsPanel";
import { ProfessionalPartnerInvitationPanel } from "./ProfessionalPartnerInvitationPanel";
import { ProfessionalPartnerInsightsPanel } from "./ProfessionalPartnerInsightsPanel";
import { ProfessionalPartnerMailPanel } from "./ProfessionalPartnerMailPanel";
import { ProfessionalPartnerOrdersPanel } from "./ProfessionalPartnerOrdersPanel";
import { ProfessionalPartnerRelationshipCard } from "./ProfessionalPartnerRelationshipCard";
import { ProfessionalPartnerSettlementsPanel } from "./ProfessionalPartnerSettlementsPanel";
import { ProfessionalPartnerTerritoryPanel } from "./ProfessionalPartnerTerritoryPanel";
import { ProfessionalPartnerValidationPanel } from "./ProfessionalPartnerValidationPanel";
import { bindProfessionalNetworkContextRouting } from "./commercial-context-bridge";
import { resolveProfessionalNetworkGovernance } from "./professional-commercial-network-governance";
import type {
  ProfessionalCommercialNetworkShellProps,
  ProfessionalNetworkPanelId,
} from "./professional-commercial-network.types";
import { useProfessionalCommercialNetworkData } from "./useProfessionalCommercialNetworkData";

const TABS: { id: ProfessionalNetworkPanelId; label: string }[] = [
  { id: "validation", label: "Validation" },
  { id: "invitation", label: "Invitation" },
  { id: "agreements", label: "Accords" },
  { id: "territory", label: "Territoires" },
  { id: "activity", label: "Activité" },
  { id: "documents", label: "Documents" },
  { id: "orders", label: "Commandes" },
  { id: "settlements", label: "Règlements" },
  { id: "mail", label: "Mail" },
  { id: "insights", label: "Signaux" },
];

function ShellInner({
  actorRole,
  enabled = true,
  injected,
  flags = {},
  contextRouting,
}: ProfessionalCommercialNetworkShellProps) {
  const governance = useMemo(
    () => resolveProfessionalNetworkGovernance(actorRole, flags),
    [actorRole, flags],
  );
  const data = useProfessionalCommercialNetworkData({ actorRole, injected, enabled });
  const routedMail = useMemo(
    () =>
      bindProfessionalNetworkContextRouting(
        { onOpenMail: data.onOpenMail, onOpenMessaging: data.onOpenMessaging },
        contextRouting,
      ),
    [contextRouting, data.onOpenMail, data.onOpenMessaging],
  );
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ProfessionalNetworkPanelId>("validation");

  const view = data.view;
  const activePartner = useMemo(
    () => view?.partners.find((p) => p.id === activePartnerId) ?? view?.partners[0] ?? null,
    [view, activePartnerId],
  );

  if (!enabled || flags.professional_commercial_network_enabled === false) {
    return (
      <section className="pcn-card" data-testid="pcn-network-disabled">
        <p className="pcn-hint">{governance.notice ?? "Réseau professionnel non activé."}</p>
      </section>
    );
  }

  if (!view) {
    return (
      <section className="pcn-card" data-testid="pcn-network-loading">
        <p className="pcn-hint">Chargement du réseau commercial…</p>
      </section>
    );
  }

  return (
    <section className="pcn-shell" data-testid="professional-commercial-network-shell">
      <ProfessionalPartnerDirectory
        partners={view.partners}
        activePartnerId={activePartner?.id ?? null}
        onSelectPartner={(id) => {
          setActivePartnerId(id);
          const p = view.partners.find((x) => x.id === id);
          if (p?.status === "pending_validation") setActivePanel("validation");
          else if (p?.status === "invited") setActivePanel("invitation");
          else setActivePanel("activity");
        }}
        closedNotice={view.closedNetworkNotice}
      />

      <div className="pcn-main">
        <header className="pcn-header">
          <h2 className="pcn-title">Réseau commercial professionnel</h2>
          <p className="pcn-subtitle">
            Relations validées — catalogues fermés — aucune auto-connexion terrain.
          </p>
          {data.onRefresh ? (
            <button type="button" className="pcn-btn" style={{ marginTop: 8 }} onClick={data.onRefresh} data-testid="pcn-refresh">
              Actualiser
            </button>
          ) : null}
        </header>

        {activePartner ? <ProfessionalPartnerRelationshipCard partner={activePartner} /> : null}

        <nav className="pcn-tabs" aria-label="Panneaux partenaire" data-testid="pcn-panel-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`pcn-tab ${activePanel === tab.id ? "pcn-tab--active" : ""}`}
              onClick={() => setActivePanel(tab.id)}
              data-testid={`pcn-tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div data-testid={`pcn-panel-active-${activePanel}`}>
          {activePanel === "invitation" && governance.invitationRequired ? (
            <ProfessionalPartnerInvitationPanel partner={activePartner} onInvite={data.onInvite} />
          ) : null}
          {activePanel === "validation" && governance.validationRequired ? (
            <ProfessionalPartnerValidationPanel
              partner={activePartner}
              onValidate={data.onValidate}
              onReject={data.onReject}
            />
          ) : null}
          {activePanel === "agreements" ? (
            <ProfessionalCommercialAgreementsPanel agreements={view.agreements} />
          ) : null}
          {activePanel === "territory" && governance.territoryControlled ? (
            <ProfessionalPartnerTerritoryPanel territory={view.territory} />
          ) : null}
          {activePanel === "activity" ? <ProfessionalPartnerActivityPanel view={view} /> : null}
          {activePanel === "documents" && governance.documentExchangeAllowed ? (
            <ProfessionalPartnerDocumentsPanel documents={view.documents} />
          ) : null}
          {activePanel === "orders" ? <ProfessionalPartnerOrdersPanel orders={view.orders} /> : null}
          {activePanel === "settlements" ? <ProfessionalPartnerSettlementsPanel settlements={view.settlements} /> : null}
          {activePanel === "mail" && governance.directMailAllowed ? (
            <ProfessionalPartnerMailPanel
              partner={activePartner}
              threads={view.mailThreads}
              onOpenMail={routedMail.onOpenMail}
              linkedEnabled
            />
          ) : null}
          {activePanel === "insights" ? <ProfessionalPartnerInsightsPanel view={view} /> : null}
        </div>

        <span
          data-testid="pcn-data-source"
          data-source={data.dataSource}
          data-fallback={data.fallbackUsed ? "true" : "false"}
          aria-hidden
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
          }}
        />
      </div>
    </section>
  );
}

export const ProfessionalCommercialNetworkShell = memo(function ProfessionalCommercialNetworkShell(
  props: ProfessionalCommercialNetworkShellProps,
) {
  return <ShellInner {...props} />;
});
