"use client";

import { useCallback, useState } from "react";
import type { RelationalFulfillmentViewResponseDto } from "@venext/shared-contracts";

import {
  nextGenericFulfillmentStatus,
  postAcceptResolutionBuyer,
  postAcceptResolutionSeller,
  postFulfillmentIncident,
  postFulfillmentProof,
  postFulfillmentTransition,
  postFulfillmentValidateReception,
  postPartialReception,
  postProposeIncidentResolution,
  postRejectReception,
} from "../relational-fulfillment-actions-api";

export function RelationalFulfillmentActionsSurface(props: {
  data: RelationalFulfillmentViewResponseDto | null;
  organizationId: string | null;
  proofEnabled: boolean;
  resolutionEnabled: boolean;
  onActionSuccess: () => void;
}) {
  const { data, organizationId, proofEnabled, resolutionEnabled, onActionSuccess } = props;
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState("/uploads/proofs/reception.pdf");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [partialNotes, setPartialNotes] = useState("");
  const [resolutionProposal, setResolutionProposal] = useState("");

  const recordId = data?.fulfillment.id ?? null;
  const status = data?.fulfillment.fulfillmentStatus;
  const isBuyer =
    organizationId != null && data?.fulfillment.buyerOrganizationId === organizationId;
  const isSeller =
    organizationId != null && data?.fulfillment.sellerOrganizationId === organizationId;
  const openBlockingIncident = data?.incidents.find(
    (i) => i.blocksFulfillmentCompletion && i.resolutionStatus !== "RESOLVED",
  );
  const nextStep = status ? nextGenericFulfillmentStatus(status) : null;
  const canValidate =
    isBuyer && (status === "ARRIVED_AT_DESTINATION" || status === "RECEPTION_PENDING_VALIDATION");
  const terminal =
    status === "FULFILLMENT_COMPLETED" || status === "FULFILLMENT_BLOCKED" || status === "RECEPTION_REJECTED";

  const run = useCallback(
    async (key: string, fn: () => Promise<{ ok: boolean }>) => {
      if (!organizationId || !recordId) return;
      setBusy(key);
      setMessage(null);
      const res = await fn();
      setBusy(null);
      if (res.ok) {
        setMessage("Action enregistrée.");
        onActionSuccess();
      } else {
        setMessage("Action refusée ou réponse invalide.");
      }
    },
    [organizationId, recordId, onActionSuccess],
  );

  if (!data || !organizationId) {
    return (
      <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-fulfillment-actions">
        <p className="text-[10px] text-slate-500">Actions indisponibles — contexte organisation / commande requis.</p>
      </section>
    );
  }

  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-fulfillment-actions">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Actions corridor (API réelle)</p>
      <p className="mt-1 text-[9px] text-slate-500">
        Référence preuve saisie manuellement — pas d&apos;upload simulé. Validation réception : acheteur corridor uniquement.
      </p>

      <div className="mt-3">
        <p className="text-[9px] font-medium text-slate-400">Avancer étape fulfillment</p>
        <button
          type="button"
          className="mt-1 rounded border border-cyan-800/60 px-2 py-1 text-[10px] text-cyan-100 disabled:opacity-40"
          disabled={!nextStep || terminal || busy !== null}
          data-testid="fulfillment-action-transition"
          onClick={() =>
            void run("transition", () =>
              postFulfillmentTransition(organizationId, recordId!, nextStep!),
            )
          }
        >
          {nextStep ? `→ ${nextStep}` : "Non disponible"}
        </button>
      </div>

      <div className="mt-3">
        <p className="text-[9px] font-medium text-slate-400">Preuve de réception</p>
        {proofEnabled ? (
          <>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[9px] text-slate-200"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="/uploads/proofs/…"
              data-testid="fulfillment-proof-url-input"
            />
            <button
              type="button"
              className="mt-1 rounded border border-cyan-800/60 px-2 py-1 text-[10px] text-cyan-100 disabled:opacity-40"
              disabled={terminal || busy !== null || !proofUrl.trim()}
              data-testid="fulfillment-action-proof"
              onClick={() =>
                void run("proof", () =>
                  postFulfillmentProof(organizationId, recordId!, "RECEIPT_DOCUMENT", proofUrl.trim()),
                )
              }
            >
              Soumettre preuve
            </button>
          </>
        ) : (
          <p className="mt-1 text-[9px] text-slate-500" data-testid="fulfillment-proof-disabled">
            Preuve désactivée (<span className="font-mono">relational_fulfillment_proof_enabled</span>).
          </p>
        )}
      </div>

      <div className="mt-3">
        <p className="text-[9px] font-medium text-slate-400">Valider réception (acheteur)</p>
        <button
          type="button"
          className="mt-1 rounded border border-cyan-800/60 px-2 py-1 text-[10px] text-cyan-100 disabled:opacity-40"
          disabled={!canValidate || terminal || busy !== null}
          data-testid="fulfillment-action-validate"
          onClick={() =>
            void run("validate", () => postFulfillmentValidateReception(organizationId, recordId!))
          }
        >
          {isBuyer ? "Valider réception" : "Réservé à l'acheteur corridor"}
        </button>
      </div>

      <div className="mt-3">
        <p className="text-[9px] font-medium text-slate-400">Déclarer incident opérationnel</p>
        <textarea
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[9px] text-slate-200"
          rows={2}
          value={incidentDesc}
          onChange={(e) => setIncidentDesc(e.target.value)}
          placeholder="Description interne corridor…"
          data-testid="fulfillment-incident-description"
        />
        <button
          type="button"
          className="mt-1 rounded border border-amber-800/60 px-2 py-1 text-[10px] text-amber-100 disabled:opacity-40"
          disabled={terminal || busy !== null || incidentDesc.trim().length < 3}
          data-testid="fulfillment-action-incident"
          onClick={() =>
            void run("incident", () =>
              postFulfillmentIncident(
                organizationId,
                recordId!,
                "DOCUMENT_MISMATCH",
                incidentDesc.trim(),
              ),
            )
          }
        >
          Déclarer incident
        </button>
      </div>

      {resolutionEnabled ? (
        <>
          <div className="mt-4 border-t border-slate-800 pt-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Résolution incident corridor (20.10)
            </p>
          </div>

          <div className="mt-3">
            <p className="text-[9px] font-medium text-slate-400">Rejeter réception (acheteur)</p>
            <textarea
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[9px] text-slate-200"
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motif opérationnel corridor…"
              data-testid="fulfillment-reject-reason"
            />
            <button
              type="button"
              className="mt-1 rounded border border-rose-800/60 px-2 py-1 text-[10px] text-rose-100 disabled:opacity-40"
              disabled={!isBuyer || !canValidate || terminal || busy !== null || rejectReason.trim().length < 3}
              data-testid="fulfillment-action-reject-reception"
              onClick={() =>
                void run("reject", () => postRejectReception(organizationId, recordId!, rejectReason.trim()))
              }
            >
              Rejeter réception
            </button>
            {!isBuyer && canValidate ? (
              <p className="mt-1 text-[8px] text-slate-500">Réservé à l&apos;acheteur corridor.</p>
            ) : null}
          </div>

          <div className="mt-3">
            <p className="text-[9px] font-medium text-slate-400">Valider réception partielle (acheteur)</p>
            <textarea
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[9px] text-slate-200"
              rows={2}
              value={partialNotes}
              onChange={(e) => setPartialNotes(e.target.value)}
              placeholder="Notes conformité partielle…"
              data-testid="fulfillment-partial-notes"
            />
            <button
              type="button"
              className="mt-1 rounded border border-cyan-800/60 px-2 py-1 text-[10px] text-cyan-100 disabled:opacity-40"
              disabled={!isBuyer || !canValidate || terminal || busy !== null || partialNotes.trim().length < 3}
              data-testid="fulfillment-action-partial-reception"
              onClick={() =>
                void run("partial", () => postPartialReception(organizationId, recordId!, partialNotes.trim()))
              }
            >
              Valider réception partielle
            </button>
          </div>

          {openBlockingIncident ? (
            <div className="mt-3 rounded border border-slate-700/80 bg-slate-900/50 p-2" data-testid="fulfillment-resolution-panel">
              <p className="text-[9px] text-slate-400">
                Incident bloquant · <span className="font-mono">{openBlockingIncident.resolutionStatus}</span>
              </p>
              <textarea
                className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[9px] text-slate-200"
                rows={2}
                value={resolutionProposal}
                onChange={(e) => setResolutionProposal(e.target.value)}
                placeholder="Proposition de résolution opérationnelle…"
                data-testid="fulfillment-resolution-proposal"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded border border-cyan-800/60 px-2 py-1 text-[10px] text-cyan-100 disabled:opacity-40"
                  disabled={busy !== null || resolutionProposal.trim().length < 3}
                  data-testid="fulfillment-action-propose-resolution"
                  onClick={() =>
                    void run("propose", () =>
                      postProposeIncidentResolution(
                        organizationId,
                        openBlockingIncident.id,
                        resolutionProposal.trim(),
                      ),
                    )
                  }
                >
                  Proposer résolution
                </button>
                <button
                  type="button"
                  className="rounded border border-cyan-800/60 px-2 py-1 text-[10px] text-cyan-100 disabled:opacity-40"
                  disabled={!isBuyer || busy !== null}
                  data-testid="fulfillment-action-accept-buyer"
                  onClick={() =>
                    void run("accept-buyer", () =>
                      postAcceptResolutionBuyer(organizationId, openBlockingIncident.id),
                    )
                  }
                >
                  Accepter (acheteur)
                </button>
                <button
                  type="button"
                  className="rounded border border-cyan-800/60 px-2 py-1 text-[10px] text-cyan-100 disabled:opacity-40"
                  disabled={!isSeller || busy !== null}
                  data-testid="fulfillment-action-accept-seller"
                  onClick={() =>
                    void run("accept-seller", () =>
                      postAcceptResolutionSeller(organizationId, openBlockingIncident.id),
                    )
                  }
                >
                  Accepter (vendeur)
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[9px] text-slate-500" data-testid="fulfillment-no-blocking-incident">
              Aucun incident bloquant ouvert — résolution partenaire non requise pour clôturer.
            </p>
          )}
        </>
      ) : (
        <p className="mt-3 text-[9px] text-slate-500" data-testid="fulfillment-resolution-disabled">
          Résolution incident désactivée (<span className="font-mono">relational_fulfillment_incident_resolution_enabled</span>).
        </p>
      )}

      {message ? <p className="mt-2 text-[9px] text-slate-400">{message}</p> : null}
    </section>
  );
}
