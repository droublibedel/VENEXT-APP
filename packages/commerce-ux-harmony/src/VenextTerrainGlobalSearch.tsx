import { memo, useCallback, useEffect, useState } from "react";

export type TerrainSearchResult = {
  id: string;
  kind: "partner" | "product" | "city" | "activity" | "contact" | "shop";
  label: string;
  subtitle?: string;
  href?: string;
};

export type TerrainSearchResponse = {
  query: string;
  results: TerrainSearchResult[];
  dataSource?: "live" | "fallback";
};

export type VenextTerrainGlobalSearchProps = {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  actorRole: "DETAILLANT" | "GROSSISTE_B";
  onSelect?: (result: TerrainSearchResult) => void;
  fetchSearch: (query: string, organizationId: string, actorRole: string) => Promise<TerrainSearchResponse>;
};

export const VenextTerrainGlobalSearch = memo(function VenextTerrainGlobalSearch({
  open,
  onClose,
  organizationId,
  actorRole,
  onSelect,
  fetchSearch,
}: VenextTerrainGlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TerrainSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (trimmed.length < 2) {
        setResults([]);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetchSearch(trimmed, organizationId, actorRole);
        setResults(res.results);
      } catch {
        setError("Recherche indisponible pour le moment.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [actorRole, fetchSearch, organizationId],
  );

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void runSearch(query), 250);
    return () => window.clearTimeout(timer);
  }, [open, query, runSearch]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="vtgs-overlay" data-testid="terrain-global-search">
      <div className="vtgs-panel" role="dialog" aria-label="Recherche globale">
        <div className="vtgs-head">
          <input
            className="vtgs-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Partenaire, produit, ville, activité…"
            autoFocus
            data-testid="terrain-global-search-input"
          />
          <button type="button" className="vtgs-close" onClick={onClose} data-testid="terrain-global-search-close">
            Fermer
          </button>
        </div>
        {loading ? <p className="vtgs-meta">Recherche…</p> : null}
        {error ? (
          <p className="vtgs-error" role="alert">
            {error}
          </p>
        ) : null}
        {!loading && !error && query.trim().length >= 2 && results.length === 0 ? (
          <p className="vtgs-meta">Aucun résultat.</p>
        ) : null}
        <ul className="vtgs-list">
          {results.map((r) => (
            <li key={`${r.kind}-${r.id}`}>
              <button
                type="button"
                className="vtgs-item"
                data-testid={`terrain-search-result-${r.kind}-${r.id}`}
                onClick={() => {
                  onSelect?.(r);
                  onClose();
                }}
              >
                <span className="vtgs-item-kind">{kindLabel(r.kind)}</span>
                <strong>{r.label}</strong>
                {r.subtitle ? <span className="vtgs-item-sub">{r.subtitle}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});

function kindLabel(kind: TerrainSearchResult["kind"]): string {
  switch (kind) {
    case "partner":
      return "Partenaire";
    case "product":
      return "Produit";
    case "city":
      return "Ville";
    case "activity":
      return "Activité";
    case "contact":
      return "Contact";
    case "shop":
      return "Boutique";
    default:
      return "Résultat";
  }
}
