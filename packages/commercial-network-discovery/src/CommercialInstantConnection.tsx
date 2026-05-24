import { memo } from "react";

export const CommercialInstantConnection = memo(function CommercialInstantConnection({
  autoAccept,
  onInstantConnect,
  disabled,
}: {
  autoAccept: boolean;
  onInstantConnect: () => void;
  disabled?: boolean;
}) {
  if (!autoAccept) return null;

  return (
    <section className="cnd-card" data-testid="cnd-instant-connection">
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>Connexion terrain immédiate</p>
      <p style={{ margin: "6px 0 10px", fontSize: 11, color: "var(--venext-text-secondary, #526059)" }}>
        Un clic crée la relation commerciale — sans validation administrative.
      </p>
      <button
        type="button"
        className="cnd-btn cnd-btn--primary"
        onClick={onInstantConnect}
        disabled={disabled}
        data-testid="cnd-instant-connect-btn"
      >
        Reconnecter mon réseau
      </button>
    </section>
  );
});
