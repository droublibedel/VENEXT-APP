"use client";

import { memo, useMemo, useRef, useState } from "react";

import type { CatalogPanelProps, CatalogProductRow, ProducerCatalogWorkspaceView } from "./producer-catalog.types";
import { ProducerCatalogPanelFrame } from "./ProducerCatalogPanelFrame";

const ROW_H = 40;

function VirtualProductTable(props: { rows: CatalogProductRow[] }) {
  const { rows } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const start = Math.floor(scrollTop / ROW_H);
  const slice = rows.slice(start, start + 9);
  const offset = start * ROW_H;

  return (
    <div
      ref={ref}
      className="max-h-[340px] overflow-y-auto rounded border border-slate-800/60"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      data-testid="catalog-product-virtual-list"
    >
      <div style={{ height: rows.length * ROW_H, position: "relative" }}>
        <table className="absolute w-full text-[11px]" style={{ top: offset }}>
          <thead className="sticky top-0 bg-slate-950/95 text-[10px] uppercase text-slate-500">
            <tr>
              <th className="px-2 py-2 text-left">Produit</th>
              <th className="px-2 py-2 text-left">Catégorie</th>
              <th className="px-2 py-2 text-left">Rotation</th>
              <th className="px-2 py-2 text-right">Demande</th>
              <th className="px-2 py-2 text-left">Dispo.</th>
              <th className="px-2 py-2 text-left">Croissance</th>
              <th className="px-2 py-2 text-right">Villes</th>
              <th className="px-2 py-2 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={row.id} className="border-t border-slate-800/50 text-slate-300" style={{ height: ROW_H }}>
                <td className="px-2 py-1 font-medium text-slate-100">{row.product}</td>
                <td className="px-2 py-1">{row.category}</td>
                <td className="px-2 py-1 capitalize">{row.rotation}</td>
                <td className="px-2 py-1 text-right font-mono text-emerald-400/90">{row.demand}%</td>
                <td className="px-2 py-1 capitalize">{row.availability}</td>
                <td className="px-2 py-1">{row.growth}</td>
                <td className="px-2 py-1 text-right font-mono">{row.cityCoverage}</td>
                <td className="px-2 py-1 capitalize">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductPerformanceInner(
  props: CatalogPanelProps & { view: ProducerCatalogWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [availability, setAvailability] = useState("");

  const filtered = useMemo(() => {
    let rows = view?.products ?? [];
    if (category) rows = rows.filter((r) => r.category === category);
    if (availability) rows = rows.filter((r) => r.availability === availability);
    if (city) rows = rows.filter((r) => r.cityCoverage >= 2 || city === "Abidjan");
    return rows;
  }, [view?.products, category, city, availability]);

  return (
    <ProducerCatalogPanelFrame
      title="Performance produits"
      subtitle="Rotation, demande et couverture terrain"
      loading={loading}
      error={error}
      empty={!filtered.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-product-performance-panel"
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded border border-slate-700/80 bg-slate-950 px-2 py-1 text-[11px] text-slate-300"
          aria-label="Filtrer par catégorie"
        >
          <option value="">Toutes catégories</option>
          {view?.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded border border-slate-700/80 bg-slate-950 px-2 py-1 text-[11px] text-slate-300"
          aria-label="Filtrer par ville"
        >
          <option value="">Toutes villes</option>
          {view?.cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="rounded border border-slate-700/80 bg-slate-950 px-2 py-1 text-[11px] text-slate-300"
          aria-label="Filtrer par disponibilité"
        >
          <option value="">Disponibilité</option>
          <option value="bonne">Bonne</option>
          <option value="moyenne">Moyenne</option>
          <option value="faible">Faible</option>
        </select>
      </div>
      <VirtualProductTable rows={filtered} />
    </ProducerCatalogPanelFrame>
  );
}

export const ProducerProductPerformancePanel = memo(ProductPerformanceInner);
