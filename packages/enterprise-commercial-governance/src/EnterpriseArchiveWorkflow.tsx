import { useState } from "react";
import { getEnterpriseSecurityTranslation } from "./enterprise-security-i18n";
import { GovernanceDocumentAttachment } from "./GovernanceDocumentAttachment";

type Props = {
  enterpriseId: string;
  locale?: string;
  authorLevel: "VENEXT_GLOBAL" | "PARTNER_SECURITY";
  onArchive?: (input: { reason: string; cessationDocument: string }) => void;
};

export function EnterpriseArchiveWorkflow({
  enterpriseId,
  locale = "fr-CI",
  authorLevel,
  onArchive,
}: Props) {
  const [reason, setReason] = useState("");
  const [docName, setDocName] = useState("");

  const venextOnly = authorLevel !== "VENEXT_GLOBAL";

  return (
    <section className="ecg-shell ecg-panel-danger" data-testid="enterprise-archive-workflow">
      <h2 className="ecg-title">
        {getEnterpriseSecurityTranslation("security.archive.workflow", locale)}
      </h2>
      <p className="ecg-muted">{enterpriseId}</p>
      {venextOnly ? (
        <p data-testid="archive-venext-only">Réservé à VENEXT Global</p>
      ) : (
        <>
          <label className="ecg-muted">
            Note détaillée *
            <textarea
              data-testid="archive-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              style={{ width: "100%", marginTop: 4 }}
            />
          </label>
          <GovernanceDocumentAttachment
            required
            locale={locale}
            onFileSelected={(f) => setDocName(f.name)}
          />
          {docName ? <p data-testid="archive-doc-name">{docName}</p> : null}
          {onArchive ? (
            <button
              type="button"
              data-testid="btn-archive-enterprise"
              style={{ marginTop: 12 }}
              onClick={() => onArchive({ reason, cessationDocument: docName || "pending-upload" })}
            >
              Archiver canal entreprise
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
