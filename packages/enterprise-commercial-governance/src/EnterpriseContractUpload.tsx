type Props = {
  onFileSelected?: (file: File) => void;
  previewUrl?: string;
};

export function EnterpriseContractUpload({ onFileSelected, previewUrl }: Props) {
  return (
    <section className="ecg-shell" data-testid="enterprise-contract-upload">
      <h2 className="ecg-title">Contrat signé</h2>
      <input
        type="file"
        accept="application/pdf,image/*"
        data-testid="contract-file-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onFileSelected) onFileSelected(file);
        }}
      />
      {previewUrl ? (
        <p className="ecg-muted" data-testid="contract-preview-hint">
          Aperçu disponible
        </p>
      ) : null}
    </section>
  );
}
