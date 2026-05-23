import { memo } from "react";

export const CommercialContactSyncPanel = memo(function CommercialContactSyncPanel({
  granted,
  localContactsCount,
  onGrant,
}: {
  granted: boolean;
  localContactsCount: number;
  onGrant: () => void;
}) {
  return (
    <section className="cnd-card" data-testid="cnd-contact-sync-panel">
      <h3 style={{ margin: "0 0 6px", fontSize: 13 }}>Contacts téléphone</h3>
      <p style={{ margin: 0, fontSize: 11, color: "#8fa39a" }}>
        VENEXT compare vos numéros enregistrés pour retrouver un réseau commercial déjà existant — sans
        marketplace publique.
      </p>
      {granted ? (
        <p
          style={{ margin: "10px 0 0", fontSize: 11, color: "#00a884" }}
          data-testid="cnd-contact-sync-granted"
        >
          {localContactsCount} contacts analysés (lecture locale, pas de scan permanent).
        </p>
      ) : (
        <button
          type="button"
          className="cnd-btn cnd-btn--primary"
          style={{ marginTop: 10 }}
          onClick={onGrant}
          data-testid="cnd-contact-sync-grant"
        >
          Autoriser l&apos;accès aux contacts
        </button>
      )}
    </section>
  );
});
