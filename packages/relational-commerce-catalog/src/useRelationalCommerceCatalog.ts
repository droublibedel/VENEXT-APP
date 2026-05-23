import { useCallback, useMemo, useState } from "react";

import { filterVisibleCatalogs } from "./relational-commerce-catalog-governance";
import type {
  RelationalCatalogFlags,
  RelationalCatalogInjected,
  RelationalOrderLine,
} from "./relational-commerce-catalog.types";
import { mockRelationalCatalogView } from "./relational-commerce-catalog.viewmodel";
import type { RelationalActorRole } from "./relational-commerce-catalog.types";

export function useRelationalCommerceCatalog(input: {
  actorRole: RelationalActorRole;
  injected?: RelationalCatalogInjected;
  enabled?: boolean;
  flags?: RelationalCatalogFlags;
}) {
  const { actorRole, injected, enabled = true, flags = {} } = input;
  const [activeSupplierId, setActiveSupplierId] = useState<string | null>(null);
  const [orderLines, setOrderLines] = useState<RelationalOrderLine[]>([]);

  const fallbackView = useMemo(
    () => (enabled ? mockRelationalCatalogView(actorRole, flags) : null),
    [actorRole, enabled, flags],
  );

  const rawView = injected?.view ?? fallbackView;

  const view = useMemo(() => {
    if (!rawView) return null;
    const catalogs = filterVisibleCatalogs(rawView.catalogs, flags, actorRole);
    return { ...rawView, catalogs };
  }, [rawView, flags, actorRole]);

  const resolvedSupplierId = useMemo(() => {
    if (activeSupplierId && view?.catalogs.some((c) => c.supplierId === activeSupplierId)) {
      return activeSupplierId;
    }
    return view?.catalogs[0]?.supplierId ?? null;
  }, [activeSupplierId, view?.catalogs]);

  const activeCatalog = useMemo(
    () => view?.catalogs.find((c) => c.supplierId === resolvedSupplierId) ?? null,
    [view?.catalogs, resolvedSupplierId],
  );

  const activePartner = useMemo(
    () => view?.partners.find((p) => p.id === resolvedSupplierId) ?? null,
    [view?.partners, resolvedSupplierId],
  );

  const addToOrder = useCallback(
    (productId: string) => {
      const product = activeCatalog?.products.find((p) => p.id === productId);
      if (!product) return;
      setOrderLines((prev) => {
        const existing = prev.find((l) => l.productId === productId);
        if (existing) {
          return prev.map((l) =>
            l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l,
          );
        }
        return [
          ...prev,
          {
            productId,
            productName: product.name,
            priceLabel: product.priceLabel,
            quantity: 1,
          },
        ];
      });
    },
    [activeCatalog?.products],
  );

  const clearOrder = useCallback(() => setOrderLines([]), []);

  return {
    view,
    loading: injected?.loading ?? false,
    error: injected?.error ?? null,
    dataSource: injected?.dataSource ?? "fallback",
    fallbackUsed: injected?.fallbackUsed ?? true,
    onRefresh: injected?.onRefresh,
    activeSupplierId: resolvedSupplierId,
    setActiveSupplierId,
    activeCatalog,
    activePartner,
    orderLines,
    addToOrder,
    clearOrder,
  };
}
