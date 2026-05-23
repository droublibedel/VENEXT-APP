type Props = {
  contractReference: string;
  scanUrl?: string;
  onConfirm?: () => void;
  onEdit?: () => void;
};

export function EnterpriseContractReview({
  contractReference,
  scanUrl,
  onConfirm,
  onEdit,
}: Props) {
  return (
    <section className="ecg-shell" data-testid="enterprise-contract-review">
      <h2 className="ecg-title">Revue contrat</h2>
      <p data-testid="contract-ref">{contractReference}</p>
      {scanUrl ? (
        <a href={scanUrl} data-testid="contract-scan-link">
          Aperçu scan
        </a>
      ) : (
        <p className="ecg-muted">Aucun scan</p>
      )}
      {(onEdit || onConfirm) && (
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          {onEdit ? (
            <button type="button" data-testid="btn-edit-contract" onClick={onEdit}>
              Modifier
            </button>
          ) : null}
          {onConfirm ? (
            <button type="button" data-testid="btn-confirm-contract" onClick={onConfirm}>
              Valider
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
