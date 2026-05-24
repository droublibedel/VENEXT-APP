import { memo } from "react";

export const RelationalCatalogEmptyState = memo(function RelationalCatalogEmptyState({
  message,
}: {
  message?: string;
}) {
  return (
    <section className="rcc-empty" data-testid="rcc-catalog-empty">
      <p style={{ margin: 0, fontWeight: 600 }}>Aucun catalogue relationnel</p>
      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#526059" }}>
        {message ??
          "Reliez-vous à un partenaire commercial pour voir son catalogue. VENEXT n&apos;affiche pas de marketplace ouverte."}
      </p>
    </section>
  );
});
