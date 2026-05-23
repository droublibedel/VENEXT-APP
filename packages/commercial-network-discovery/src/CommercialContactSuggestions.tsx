import { memo, useMemo, useRef, useState } from "react";

import { CommercialRelationshipCard } from "./CommercialRelationshipCard";
import type { CommercialContactSuggestion } from "./commercial-network-discovery.types";
import { filterVisibleSuggestions } from "./useCommercialContactDiscovery";

const ROW_HEIGHT = 132;
const VIEWPORT = 5;

const VirtualSuggestions = memo(function VirtualSuggestions({
  suggestions,
  syncGranted,
  autoAccept,
  onConnect,
}: {
  suggestions: CommercialContactSuggestion[];
  syncGranted: boolean;
  autoAccept: boolean;
  onConnect: (id: string) => void;
}) {
  const visible = filterVisibleSuggestions(suggestions, syncGranted);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const { start, end, offset } = useMemo(() => {
    const startIdx = Math.floor(scrollTop / ROW_HEIGHT);
    const count = Math.min(visible.length - startIdx, VIEWPORT + 2);
    return { start: startIdx, end: startIdx + count, offset: startIdx * ROW_HEIGHT };
  }, [scrollTop, visible.length]);

  const slice = visible.slice(start, end);

  return (
    <div
      ref={scrollRef}
      className="cnd-suggestions-scroll"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      data-testid="cnd-suggestions-virtual-list"
    >
      <div style={{ height: visible.length * ROW_HEIGHT, position: "relative" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: offset, display: "flex", flexDirection: "column", gap: 8 }}>
          {slice.map((s) => (
            <div key={s.id} style={{ minHeight: ROW_HEIGHT - 8 }}>
              <CommercialRelationshipCard
                suggestion={s}
                autoAccept={autoAccept}
                onConnect={() => onConnect(s.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export const CommercialContactSuggestions = memo(function CommercialContactSuggestions({
  suggestions,
  syncGranted,
  autoAccept,
  onConnect,
}: {
  suggestions: CommercialContactSuggestion[];
  syncGranted: boolean;
  autoAccept: boolean;
  onConnect: (id: string) => void;
}) {
  if (!suggestions.length) {
    return (
      <p className="cnd-hint" data-testid="cnd-suggestions-empty">
        Aucune suggestion pour le moment. Autorisez l&apos;accès aux contacts pour retrouver votre réseau.
      </p>
    );
  }

  return (
    <section data-testid="cnd-contact-suggestions">
      <h3 style={{ fontSize: 13, margin: "0 0 8px", color: "#8fa39a" }}>Personnes que vous pourriez connaître</h3>
      <VirtualSuggestions
        suggestions={suggestions}
        syncGranted={syncGranted}
        autoAccept={autoAccept}
        onConnect={onConnect}
      />
    </section>
  );
});
