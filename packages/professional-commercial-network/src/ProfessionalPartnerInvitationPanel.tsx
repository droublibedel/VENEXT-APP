import { memo, useState } from "react";

import type { ProfessionalPartner } from "./professional-commercial-network.types";

export const ProfessionalPartnerInvitationPanel = memo(function ProfessionalPartnerInvitationPanel({
  partner,
  onInvite,
}: {
  partner: ProfessionalPartner | null;
  onInvite?: (payload: { partnerId?: string; message: string }) => void;
}) {
  const [message, setMessage] = useState(
    "Bonjour,\n\nNous souhaitons établir une relation commerciale professionnelle structurée.\n\nCordialement",
  );
  const [territory, setTerritory] = useState("");
  const [products, setProducts] = useState("");

  return (
    <section className="pcn-card" data-testid="pcn-invitation-panel">
      <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>Invitation commerciale formelle</h3>
      <p style={{ margin: "0 0 10px", fontSize: 10, color: "#8a9bab" }}>
        Relation fournisseur / distributeur — validation explicite requise. Pas d&apos;invitation sociale.
      </p>
      <div className="pcn-form">
        <label>
          Partenaire cible
          <input readOnly value={partner?.companyName ?? "Sélectionnez un partenaire"} data-testid="pcn-invite-partner" />
        </label>
        <label>
          Message professionnel
          <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} data-testid="pcn-invite-message" />
        </label>
        <label>
          Territoires concernés
          <input value={territory} onChange={(e) => setTerritory(e.target.value)} placeholder="Abidjan, corridor sud…" data-testid="pcn-invite-territory" />
        </label>
        <label>
          Produits / catégories
          <input value={products} onChange={(e) => setProducts(e.target.value)} placeholder="Boissons, farine…" data-testid="pcn-invite-products" />
        </label>
        <p style={{ fontSize: 10, color: "#64748b" }}>Pièces jointes : PDF, XLSX, DOCX (fondation UI)</p>
      </div>
      <button
        type="button"
        className="pcn-btn pcn-btn--primary"
        disabled={!partner}
        onClick={() => onInvite?.({ partnerId: partner?.id, message })}
        data-testid="pcn-invite-send"
      >
        Envoyer l&apos;invitation commerciale
      </button>
    </section>
  );
});
