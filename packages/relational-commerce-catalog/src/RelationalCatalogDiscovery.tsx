import { memo } from "react";

import type { RelationalDiscoveryItem } from "./relational-commerce-catalog.types";

export const RelationalCatalogDiscovery = memo(function RelationalCatalogDiscovery({
  items,
  onSelect,
}: {
  items: RelationalDiscoveryItem[];
  onSelect?: (supplierId: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="rcc-discovery" data-testid="rcc-catalog-discovery">
      <h3 className="rcc-discovery-title">Suggestions réseau</h3>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="rcc-discovery-row"
          data-testid={`rcc-discovery-${item.id}`}
          data-sponsored={item.sponsored ? "true" : "false"}
          onClick={() => item.supplierId && onSelect?.(item.supplierId)}
          disabled={!item.supplierId}
        >
          <span className="rcc-discovery-label">{item.label}</span>
          <span className="rcc-discovery-hint">{item.hint}</span>
        </button>
      ))}
    </section>
  );
});
