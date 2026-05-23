import { useState } from "react";

import type { EnterpriseCommercialChannel, GovernanceLevel } from "./enterprise-governance.types";
import { auditEnterpriseGovernanceIntegrity } from "./enterprise-governance-audit";
import { getEnterpriseSecurityTranslation } from "./enterprise-security-i18n";
import { EnterpriseGovernanceDataSourceBadge } from "./EnterpriseGovernanceDataSourceBadge";
import {
  canRunSensitiveGovernancePanelAction,
  fetchEnterpriseGovernanceHistoryGlobalForPanel,
  sensitiveActionUnavailableMessage,
} from "./enterprise-governance-live-ui-client";
import { patchEnterpriseChannelStatusFromPanel } from "./enterprise-governance-live-panel-actions";
import { useEnterpriseGovernanceLiveChannels } from "./enterprise-governance-live-hooks";
import { listEnterpriseTrustedDeviceHistory } from "./enterprise-trusted-device-governance";

export type EnterpriseGlobalGovernanceControlPanelProps = {
  locale?: string;
};

export function EnterpriseGlobalGovernanceControlPanel({
  locale = "fr-CI",
}: EnterpriseGlobalGovernanceControlPanelProps) {
  const [note, setNote] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [historyCount, setHistoryCount] = useState(0);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const { loading, envelope, reload } = useEnterpriseGovernanceLiveChannels();

  const channels = (envelope?.data ?? []) as EnterpriseCommercialChannel[];
  const meta = envelope ?? { dataSource: "FALLBACK" as const, fallbackUsed: true };
  const actionsEnabled = canRunSensitiveGovernancePanelAction(meta);
  const audit = auditEnterpriseGovernanceIntegrity(channels.map((c) => c.enterpriseId));

  const loadHistory = () => {
    void fetchEnterpriseGovernanceHistoryGlobalForPanel().then((h) => setHistoryCount(h.data.length));
  };

  const runArchive = async () => {
    if (!selectedId || note.trim().length < 8) return;
    setActionMsg(null);
    const result = await patchEnterpriseChannelStatusFromPanel(selectedId, "archive", note, meta);
    if (!result.ok) {
      setActionMsg(result.message ?? sensitiveActionUnavailableMessage());
      return;
    }
    setNote("");
    reload();
  };

  const runReactivate = async () => {
    if (!selectedId || note.trim().length < 8) return;
    setActionMsg(null);
    const result = await patchEnterpriseChannelStatusFromPanel(selectedId, "reactivate", note, meta);
    if (!result.ok) {
      setActionMsg(result.message ?? sensitiveActionUnavailableMessage());
      return;
    }
    setNote("");
    reload();
  };

  return (
    <section className="ecg-shell" data-testid="enterprise-global-governance-panel">
      <h2 className="ecg-title">Contrôle global VENEXT</h2>
      {envelope ? (
        <EnterpriseGovernanceDataSourceBadge
          dataSource={envelope.dataSource}
          fallbackUsed={envelope.fallbackUsed}
          error={envelope.error}
        />
      ) : null}
      <p style={{ fontSize: 13, opacity: 0.85 }}>
        {getEnterpriseSecurityTranslation("security.connection.verify", locale)}
      </p>

      {loading ? <p className="ecg-muted">Chargement…</p> : null}

      <label style={{ display: "block", marginTop: 12 }}>
        Entreprise
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          data-testid="global-governance-enterprise-select"
          style={{ display: "block", width: "100%", marginTop: 4 }}
        >
          <option value="">—</option>
          {channels.map((c) => (
            <option key={c.enterpriseId} value={c.enterpriseId}>
              {c.companyName}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "block", marginTop: 12 }}>
        Note de justification
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          data-testid="global-governance-note"
          rows={3}
          style={{ display: "block", width: "100%", marginTop: 4 }}
        />
      </label>

      {!actionsEnabled ? (
        <p className="ecg-muted" data-testid="global-governance-live-required">
          {sensitiveActionUnavailableMessage()}
        </p>
      ) : null}

      <div className="ecg-actions" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          data-testid="global-suspend-enterprise"
          disabled={!selectedId || !actionsEnabled}
          onClick={() => void runArchive()}
        >
          Archiver entreprise
        </button>
        <button
          type="button"
          data-testid="global-reactivate-enterprise"
          disabled={!selectedId || !actionsEnabled}
          onClick={() => void runReactivate()}
        >
          Réactiver entreprise
        </button>
        <button
          type="button"
          data-testid="global-revoke-invitations"
          disabled={!selectedId || !actionsEnabled}
          title={!actionsEnabled ? sensitiveActionUnavailableMessage() : undefined}
        >
          Révoquer invitations (LIVE)
        </button>
      </div>

      {actionMsg ? <p className="ecg-error">{actionMsg}</p> : null}

      <p className="ecg-section-title" style={{ marginTop: 16 }}>
        Audit intégrité ({audit.issues.length} point{audit.issues.length > 1 ? "s" : ""})
      </p>
      <ul data-testid="global-governance-audit-list" style={{ fontSize: 13 }}>
        {audit.issues.slice(0, 8).map((i, idx) => (
          <li key={idx}>
            {i.code}: {i.detail}
          </li>
        ))}
        {audit.ok ? <li>Aucune anomalie détectée</li> : null}
      </ul>

      <p className="ecg-section-title">
        Historique global ({historyCount}){" "}
        <button type="button" onClick={loadHistory}>
          Actualiser
        </button>
      </p>
      {selectedId ? (
        <p style={{ fontSize: 12 }} data-testid="global-device-history-count">
          Devices historisés : {listEnterpriseTrustedDeviceHistory(selectedId).length}
        </p>
      ) : null}
    </section>
  );
}
