import { memo } from "react";

import type { ProfessionalCommercialDocument } from "./professional-commercial-network.types";

const KIND: Record<ProfessionalCommercialDocument["kind"], string> = {
  pdf: "PDF",
  xlsx: "Excel",
  docx: "Word",
  csv: "CSV",
  png: "PNG",
  jpg: "JPG",
};

export const ProfessionalPartnerDocumentsPanel = memo(function ProfessionalPartnerDocumentsPanel({
  documents,
}: {
  documents: ProfessionalCommercialDocument[];
}) {
  return (
    <section className="pcn-card" data-testid="pcn-documents-panel">
      <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>Documents commerciaux</h3>
      {documents.length === 0 ? (
        <p style={{ fontSize: 11, color: "#8a9bab" }}>Aucun document échangé.</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {documents.map((d) => (
            <li key={d.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(100,130,160,0.15)" }} data-testid={`pcn-doc-${d.id}`}>
              <strong style={{ fontSize: 11 }}>{d.name}</strong>
              <span style={{ display: "block", fontSize: 10, color: "#8a9bab", marginTop: 2 }}>
                {KIND[d.kind]} · {d.sizeLabel} · {d.category} · {d.at}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});
