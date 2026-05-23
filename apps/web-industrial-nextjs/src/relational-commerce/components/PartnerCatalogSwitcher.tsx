"use client";

import type { PartnerSegment } from "../types";

type Props = {
  segments: PartnerSegment[];
  selectedSupplierId: string | null;
  onSelect: (supplierOrganizationId: string | null) => void;
};

/**
 * PartnerCatalogContextSwitcher — explicit supplier context; lanes never merge invisibly.
 */
export function PartnerCatalogSwitcher({ segments, selectedSupplierId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fournisseur actif</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
            selectedSupplierId === null
              ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-50"
              : "border-slate-700 text-slate-400"
          }`}
        >
          Tous (segments séparés)
        </button>
        {segments.map((s) => {
          const name = s.supplier?.displayName ?? s.supplierOrganizationId.slice(0, 8);
          const active = selectedSupplierId === s.supplierOrganizationId;
          return (
            <button
              key={s.supplierOrganizationId}
              type="button"
              onClick={() => onSelect(s.supplierOrganizationId)}
              className={`max-w-[220px] truncate rounded-full border px-3 py-1.5 text-xs font-medium ${
                active
                  ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-50"
                  : "border-slate-700 text-slate-300"
              }`}
              title={`Catalogue isolé — ${s.catalogIsolation}`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
