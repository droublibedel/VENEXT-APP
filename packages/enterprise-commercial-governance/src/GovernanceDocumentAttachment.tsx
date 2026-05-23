import { getEnterpriseSecurityTranslation } from "./enterprise-security-i18n";

type Props = {
  onFileSelected?: (file: File) => void;
  documentUrl?: string;
  required?: boolean;
  locale?: string;
};

export function GovernanceDocumentAttachment({
  onFileSelected,
  documentUrl,
  required = false,
  locale = "fr-CI",
}: Props) {
  return (
    <section className="ecg-shell" data-testid="governance-document-attachment">
      <h3 className="ecg-title">
        {getEnterpriseSecurityTranslation("security.document.attachment", locale)}
        {required ? " *" : ""}
      </h3>
      <input
        type="file"
        accept="application/pdf,image/*"
        data-testid="governance-doc-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onFileSelected) onFileSelected(file);
        }}
      />
      {documentUrl ? (
        <p className="ecg-muted" data-testid="governance-doc-preview">
          Document joint
        </p>
      ) : null}
    </section>
  );
}
