import { memo } from "react";

import type { RelationalCommercialContextData, RelationalOrderLine } from "./relational-commerce-catalog.types";

export const RelationalOrderComposer = memo(function RelationalOrderComposer({
  lines,
  context,
  supplierId,
  onSubmit,
  onClear,
}: {
  lines: RelationalOrderLine[];
  context: RelationalCommercialContextData;
  supplierId: string;
  onSubmit?: () => void;
  onClear?: () => void;
}) {
  return (
    <section className="rcc-order-composer" data-testid="rcc-order-composer">
      <h3 className="rcc-order-title">Commande relationnelle</h3>
      <p className="rcc-order-meta" data-testid="rcc-order-supplier">
        Fournisseur : {context.activePartnerName} · relation active
      </p>
      {context.corridor ? (
        <p className="rcc-order-meta" data-testid="rcc-order-corridor">
          Corridor : {context.corridor}
        </p>
      ) : null}
      {context.activityLabel ? (
        <p className="rcc-order-meta" data-testid="rcc-order-activity">
          Activité : {context.activityLabel}
        </p>
      ) : null}
      <input type="hidden" value={supplierId} data-testid="rcc-order-supplier-id" readOnly />
      {lines.length === 0 ? (
        <p className="rcc-order-empty">Ajoutez des produits depuis le catalogue partenaire.</p>
      ) : (
        <ul className="rcc-order-lines" data-testid="rcc-order-lines">
          {lines.map((l) => (
            <li key={l.productId} data-testid={`rcc-order-line-${l.productId}`}>
              {l.productName} × {l.quantity} — {l.priceLabel}
            </li>
          ))}
        </ul>
      )}
      <div className="rcc-order-actions">
        {onClear ? (
          <button type="button" className="rcc-btn" onClick={onClear} data-testid="rcc-order-clear">
            Vider
          </button>
        ) : null}
        {onSubmit && lines.length > 0 ? (
          <button
            type="button"
            className="rcc-btn rcc-btn--primary"
            onClick={onSubmit}
            data-testid="rcc-order-submit"
          >
            Valider la commande
          </button>
        ) : null}
      </div>
    </section>
  );
});
