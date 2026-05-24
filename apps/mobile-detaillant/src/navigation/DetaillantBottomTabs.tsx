import { memo } from "react";
import {
  Home,
  Network,
  PackageSearch,
  ReceiptText,
} from "lucide-react";

import { DETAILLANT_BOTTOM_TABS, isDetaillantBottomTab, type DetaillantTabId } from "./detaillant-navigation.config";

type Props = {
  activeTab: DetaillantTabId;
  onSelect: (tab: DetaillantTabId) => void;
};

const icons = {
  home: Home,
  catalog: PackageSearch,
  orders: ReceiptText,
  network: Network,
} as const;

export const DetaillantBottomTabs = memo(function DetaillantBottomTabs({ activeTab, onSelect }: Props) {
  return (
    <nav className="detaillant-tabs" data-testid="detaillant-bottom-tabs" aria-label="Navigation">
      {DETAILLANT_BOTTOM_TABS.map((tab) => {
        const active = isDetaillantBottomTab(activeTab) && tab.id === activeTab;
        const Icon = icons[tab.icon];
        return (
          <button
            key={tab.id}
            type="button"
            className={`detaillant-tab${active ? " detaillant-tab--active" : ""}`}
            data-testid={tab.testId}
            aria-current={active ? "page" : undefined}
            onClick={() => onSelect(tab.id)}
          >
            <span className="detaillant-tab-icon" aria-hidden>
              <Icon size={active ? 22 : 21} strokeWidth={1.85} />
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
});
