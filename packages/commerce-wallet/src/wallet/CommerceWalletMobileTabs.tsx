import { memo } from "react";

import type { CommerceWalletPanel } from "../hooks/commerce-wallet.types";

const PANELS: { id: CommerceWalletPanel; label: string }[] = [
  { id: "overview", label: "Solde" },
  { id: "transactions", label: "Mouvements" },
  { id: "payments", label: "Payer" },
  { id: "partners", label: "Partenaires" },
];

export const CommerceWalletMobileTabs = memo(function CommerceWalletMobileTabs({
  activePanel,
  onSelect,
  testId = "cw-mobile-tabs",
}: {
  activePanel: CommerceWalletPanel;
  onSelect: (panel: CommerceWalletPanel) => void;
  testId?: string;
}) {
  return (
    <nav className="cw-mobile-tabs" data-testid={testId} aria-label="Wallet mobile">
      {PANELS.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`cw-mobile-tab${activePanel === p.id ? " cw-mobile-tab--active" : ""}`}
          data-testid={`cw-mobile-tab-${p.id}`}
          onClick={() => onSelect(p.id)}
        >
          {p.label}
        </button>
      ))}
    </nav>
  );
});
