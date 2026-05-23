import { memo, useMemo, useRef, useState } from "react";

import type { RelationalCatalog, RelationalPartner } from "./relational-commerce-catalog.types";
import { RelationalCatalogSection } from "./RelationalCatalogSection";
import { RelationalProductCard } from "./RelationalProductCard";
import { RelationalCatalogVisibility } from "./RelationalCatalogVisibility";
import { RelationalPartnerHeader } from "./RelationalPartnerHeader";
import { buildRelationalCatalogSignals } from "./relational-commerce-catalog-intelligence";

const ROW = 88;
const VIEW = 6;

function VirtualProducts({
  products,
  supplierId,
  onQuickOrder,
  onDiscuss,
  onAddToCart,
}: {
  products: RelationalCatalog["products"];
  supplierId: string;
  onQuickOrder?: (supplierId: string, productId: string) => void;
  onDiscuss?: (supplierId: string, productId: string) => void;
  onAddToCart?: (productId: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  const { start, slice, offset } = useMemo(() => {
    const s = Math.floor(top / ROW);
    const n = Math.min(products.length - s, VIEW + 2);
    return { start: s, slice: products.slice(s, s + n), offset: s * ROW };
  }, [top, products]);

  return (
    <div
      ref={ref}
      className="rcc-virtual-scroll"
      onScroll={(e) => setTop(e.currentTarget.scrollTop)}
      data-testid="rcc-product-virtual-list"
    >
      <div style={{ height: products.length * ROW, position: "relative" }}>
        <div style={{ position: "absolute", top: offset, left: 0, right: 0 }}>
          {slice.map((p) => (
            <RelationalProductCard
              key={p.id}
              product={p}
              supplierId={supplierId}
              onQuickOrder={onQuickOrder}
              onDiscuss={onDiscuss}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const RelationalSupplierCatalog = memo(function RelationalSupplierCatalog({
  partner,
  catalog,
  onQuickOrder,
  onDiscuss,
  onAddToCart,
}: {
  partner: RelationalPartner;
  catalog: RelationalCatalog;
  onQuickOrder?: (supplierId: string, productId: string) => void;
  onDiscuss?: (supplierId: string, productId: string) => void;
  onAddToCart?: (productId: string) => void;
}) {
  const signals = useMemo(() => buildRelationalCatalogSignals(catalog), [catalog]);
  const popular = catalog.products.filter((p) => p.badge === "forte-demande");
  const rest = catalog.products.filter((p) => p.badge !== "forte-demande");

  return (
    <section className="rcc-supplier-catalog" data-testid={`rcc-supplier-catalog-${catalog.supplierId}`}>
      <RelationalPartnerHeader partner={partner} />
      <RelationalCatalogVisibility
        visibilityMode={catalog.visibilityMode}
        relationshipLevel={catalog.relationshipLevel}
        sponsored={catalog.sponsored}
        restricted={catalog.restrictedCatalog}
      />
      {signals.map((s) => (
        <p key={s} className="rcc-hint" data-testid="rcc-catalog-hint">
          {s}
        </p>
      ))}
      <RelationalCatalogSection
        title="Produits populaires réseau"
        products={popular}
        supplierId={catalog.supplierId}
        onQuickOrder={onQuickOrder}
        onDiscuss={onDiscuss}
        onAddToCart={onAddToCart}
      />
      {rest.length > 4 ? (
        <VirtualProducts
          products={rest}
          supplierId={catalog.supplierId}
          onQuickOrder={onQuickOrder}
          onDiscuss={onDiscuss}
          onAddToCart={onAddToCart}
        />
      ) : (
        <RelationalCatalogSection
          title="Catalogue partenaire"
          products={rest}
          supplierId={catalog.supplierId}
          onQuickOrder={onQuickOrder}
          onDiscuss={onDiscuss}
          onAddToCart={onAddToCart}
        />
      )}
    </section>
  );
});
