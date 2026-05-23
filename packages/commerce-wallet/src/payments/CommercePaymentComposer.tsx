import { memo, useState } from "react";

import type { ResolvedWalletGovernance } from "../governance/commerce-wallet-governance.types";
import type { SettlementMethod } from "../settlements/commerce-settlement.types";
import { SETTLEMENT_METHOD_LABELS } from "../settlements/commerce-settlement.types";

export const CommercePaymentComposer = memo(function CommercePaymentComposer({
  governance,
  testId = "cw-payment-composer",
  variant = "default",
  onSubmit,
}: {
  governance?: ResolvedWalletGovernance | null;
  testId?: string;
  variant?: "default" | "mobile";
  onSubmit?: (payload: {
    action: string;
    method: SettlementMethod;
    reference: string;
    terrainNote: string;
    partnerConfirmed: boolean;
  }) => void;
}) {
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [terrainNote, setTerrainNote] = useState("");
  const [partnerConfirmed, setPartnerConfirmed] = useState(false);
  const methods = governance?.allowedSettlementMethods.length
    ? governance.allowedSettlementMethods
    : (["cash", "mobile-money", "bank-transfer", "hybrid", "manual-confirmation"] as SettlementMethod[]);
  const [method, setMethod] = useState<SettlementMethod>(methods[0] ?? "cash");

  if (governance && !governance.paymentComposerVisible) {
    return (
      <p className="cw-composer-hidden" data-testid="cw-composer-hidden">
        {governance.notice ?? "Paiement non disponible pour ce contexte."}
      </p>
    );
  }

  const actions = governance?.quickActions ?? ["Confirmer paiement", "Voir statut"];
  const isMobile = variant === "mobile";

  return (
    <div
      className={`cw-composer${isMobile ? " cw-composer--mobile" : ""}`}
      data-testid={testId}
      data-variant={variant}
    >
      {governance?.settlementTrackingOnly ? (
        <p className="cw-confirmation-hint" data-testid="cw-composer-tracking-notice">
          Suivi commercial — paiement électronique non obligatoire.
        </p>
      ) : null}
      <label className="cw-field-label" htmlFor="cw-composer-method">
        Méthode de règlement
      </label>
      <select
        id="cw-composer-method"
        className="cw-select"
        data-testid="cw-composer-method-select"
        value={method}
        onChange={(e) => setMethod(e.target.value as SettlementMethod)}
      >
        {methods.map((m) => (
          <option key={m} value={m}>
            {SETTLEMENT_METHOD_LABELS[m]}
          </option>
        ))}
      </select>
      <div className={isMobile ? "cw-composer-scroll" : "cw-composer-chips"}>
        {actions.map((a) => (
          <button
            key={a}
            type="button"
            className={`cw-chip${isMobile ? " cw-chip--touch" : ""}`}
            data-testid={`cw-action-${a.replace(/\s/g, "-").toLowerCase()}`}
            onClick={() => setNote(a)}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="cw-composer-row">
        <input
          className="cw-input"
          placeholder="Action ou note…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          data-testid="cw-composer-input"
          aria-label="Note paiement"
        />
      </div>
      <div className="cw-composer-row">
        <input
          className="cw-input"
          placeholder="Référence règlement"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          data-testid="cw-composer-reference"
          aria-label="Référence"
        />
      </div>
      <textarea
        className="cw-textarea"
        rows={isMobile ? 1 : 2}
        placeholder="Commentaire terrain…"
        value={terrainNote}
        onChange={(e) => setTerrainNote(e.target.value)}
        data-testid="cw-composer-terrain"
        aria-label="Commentaire terrain"
      />
      {governance?.requiresPartnerConfirmation ? (
        <label className="cw-checkbox-row" data-testid="cw-composer-partner-checkbox">
          <input
            type="checkbox"
            checked={partnerConfirmed}
            onChange={(e) => setPartnerConfirmed(e.target.checked)}
          />
          Confirmation partenaire
        </label>
      ) : null}
      <div className="cw-composer-row">
        <button
          type="button"
          className="cw-send"
          data-testid="cw-composer-submit"
          style={{ minHeight: 44 }}
          onClick={() => {
            const action = note.trim() || actions[0] || "Confirmer";
            onSubmit?.({
              action,
              method,
              reference: reference.trim(),
              terrainNote: terrainNote.trim(),
              partnerConfirmed,
            });
            setNote("");
            setReference("");
            setTerrainNote("");
          }}
        >
          Confirmer
        </button>
      </div>
    </div>
  );
});
