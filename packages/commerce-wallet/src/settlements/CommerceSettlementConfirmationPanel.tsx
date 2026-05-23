import { memo, useState } from "react";

import type { ResolvedWalletGovernance } from "../governance/commerce-wallet-governance.types";
import type { SettlementMethod } from "./commerce-settlement.types";
import { SETTLEMENT_METHOD_LABELS } from "./commerce-settlement.types";

export const CommerceSettlementConfirmationPanel = memo(function CommerceSettlementConfirmationPanel({
  governance,
  onConfirm,
  testId = "cw-settlement-confirmation-panel",
}: {
  governance?: ResolvedWalletGovernance | null;
  onConfirm?: (payload: {
    method: SettlementMethod;
    reference: string;
    terrainNote: string;
    partnerConfirmed: boolean;
  }) => void;
  testId?: string;
}) {
  const [reference, setReference] = useState("");
  const [terrainNote, setTerrainNote] = useState("");
  const [method, setMethod] = useState<SettlementMethod>(
    governance?.allowedSettlementMethods[0] ?? "cash",
  );
  const [partnerConfirmed, setPartnerConfirmed] = useState(false);

  const methods = governance?.allowedSettlementMethods.length
    ? governance.allowedSettlementMethods
    : (["cash", "mobile-money", "manual-confirmation"] as SettlementMethod[]);

  return (
    <section className="cw-confirmation-panel" data-testid={testId}>
      <p className="cw-confirmation-title">Confirmation terrain</p>
      {governance?.settlementTrackingOnly ? (
        <p className="cw-confirmation-hint" data-testid="cw-tracking-only-notice">
          Visibilité commerciale — aucun paiement électronique obligatoire.
        </p>
      ) : null}
      <label className="cw-field-label" htmlFor="cw-settlement-method">
        Méthode de règlement
      </label>
      <select
        id="cw-settlement-method"
        className="cw-select"
        data-testid="cw-settlement-method-select"
        value={method}
        onChange={(e) => setMethod(e.target.value as SettlementMethod)}
      >
        {methods.map((m) => (
          <option key={m} value={m}>
            {SETTLEMENT_METHOD_LABELS[m]}
          </option>
        ))}
      </select>
      <label className="cw-field-label" htmlFor="cw-settlement-reference">
        Référence règlement
      </label>
      <input
        id="cw-settlement-reference"
        className="cw-input"
        data-testid="cw-settlement-reference-input"
        placeholder="Réf. cash, mobile money, virement…"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />
      <label className="cw-field-label" htmlFor="cw-terrain-note">
        Commentaire terrain
      </label>
      <textarea
        id="cw-terrain-note"
        className="cw-textarea"
        data-testid="cw-terrain-note-input"
        rows={2}
        placeholder="Détail terrain, créneau, contact…"
        value={terrainNote}
        onChange={(e) => setTerrainNote(e.target.value)}
      />
      {governance?.requiresPartnerConfirmation ? (
        <label className="cw-checkbox-row" data-testid="cw-partner-confirm-checkbox">
          <input
            type="checkbox"
            checked={partnerConfirmed}
            onChange={(e) => setPartnerConfirmed(e.target.checked)}
          />
          Confirmation partenaire reçue
        </label>
      ) : null}
      <button
        type="button"
        className="cw-send"
        data-testid="cw-manual-confirmation-submit"
        style={{ minHeight: 44, marginTop: 10 }}
        onClick={() =>
          onConfirm?.({ method, reference, terrainNote, partnerConfirmed })
        }
      >
        Confirmer le règlement
      </button>
    </section>
  );
});
