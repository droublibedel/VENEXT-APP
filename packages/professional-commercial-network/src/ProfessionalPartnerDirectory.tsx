import { memo, useMemo, useRef, useState } from "react";

import type { ProfessionalPartner } from "./professional-commercial-network.types";
import { resolveProfessionalPartnerDisplay } from "./professional-partner-display";

const ROW = 64;
const VIEW = 8;

function VirtualDirectory({
  partners,
  activeId,
  onSelect,
}: {
  partners: ProfessionalPartner[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  const { start, end, offset } = useMemo(() => {
    const s = Math.floor(top / ROW);
    const n = Math.min(partners.length - s, VIEW + 2);
    return { start: s, end: s + n, offset: s * ROW };
  }, [top, partners.length]);
  const slice = partners.slice(start, end);

  return (
    <div ref={ref} className="pcn-scroll" onScroll={(e) => setTop(e.currentTarget.scrollTop)} data-testid="pcn-partner-virtual-list">
      <div style={{ height: partners.length * ROW, position: "relative" }}>
        <div style={{ position: "absolute", top: offset, left: 0, right: 0 }}>
          {slice.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`pcn-partner-row ${activeId === p.id ? "pcn-partner-row--active" : ""}`}
              onClick={() => onSelect(p.id)}
              data-testid={`pcn-partner-row-${p.id}`}
              style={{ height: ROW - 4 }}
            >
              <strong style={{ fontSize: 13, fontWeight: 700 }}>
                {resolveProfessionalPartnerDisplay(p).displayName}
              </strong>
              <span style={{ display: "block", fontSize: 10, color: "#8a9bab", marginTop: 2 }}>
                {resolveProfessionalPartnerDisplay(p).secondaryName ??
                  `${p.city} · ${p.status === "active" ? "Actif" : p.status === "pending_validation" ? "Validation" : p.status}`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const ProfessionalPartnerDirectory = memo(function ProfessionalPartnerDirectory({
  partners,
  activePartnerId,
  onSelectPartner,
  closedNotice,
}: {
  partners: ProfessionalPartner[];
  activePartnerId: string | null;
  onSelectPartner: (id: string) => void;
  closedNotice: string;
}) {
  return (
    <aside className="pcn-directory" data-testid="pcn-partner-directory">
      <h2 className="pcn-title" style={{ fontSize: 13 }}>
        Répertoire partenaires
      </h2>
      <p className="pcn-subtitle">{closedNotice}</p>
      {partners.length === 0 ? (
        <p className="pcn-hint" data-testid="pcn-directory-empty">
          Aucun partenaire — réseau fermé.
        </p>
      ) : (
        <VirtualDirectory partners={partners} activeId={activePartnerId} onSelect={onSelectPartner} />
      )}
    </aside>
  );
});
