import { memo } from "react";

import type { CommerceWalletPanel } from "../hooks/commerce-wallet.types";

const PANELS: { id: CommerceWalletPanel; label: string }[] = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "transactions", label: "Transactions" },
  { id: "payments", label: "Paiements" },
  { id: "partners", label: "Partenaires" },
];

export const CommerceWalletSidebar = memo(function CommerceWalletSidebar({
  activePanel,
  onSelect,
  dataSource,
  fallbackUsed,
  testId = "cw-wallet-sidebar",
}: {
  activePanel: CommerceWalletPanel;
  onSelect: (panel: CommerceWalletPanel) => void;
  dataSource: string;
  fallbackUsed: boolean;
  testId?: string;
}) {
  return (
    <aside className="cw-sidebar" data-testid={testId}>
      <p className="cw-sidebar-title">RÈGLEMENTS COMMERCE</p>
      <p
        className="cw-source"
        data-testid="cw-data-source"
        data-fallback={fallbackUsed ? "true" : "false"}
        data-source={dataSource}
      >
        {fallbackUsed ? "Données de démonstration" : "Données synchronisées"}
      </p>
      <nav className="cw-sidebar-nav" aria-label="Sections wallet">
        {PANELS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`cw-sidebar-item${activePanel === p.id ? " cw-sidebar-item--active" : ""}`}
            data-testid={`cw-panel-${p.id}`}
            onClick={() => onSelect(p.id)}
          >
            {p.label}
          </button>
        ))}
      </nav>
    </aside>
  );
});
