import { memo } from "react";

import { DETAILLANT_TABS, type DetaillantTabId } from "./detaillant-navigation.config";

type Props = {
  activeTab: DetaillantTabId;
  onSelect: (tab: DetaillantTabId) => void;
};

export const DetaillantBottomTabs = memo(function DetaillantBottomTabs({ activeTab, onSelect }: Props) {
  return (
    <nav className="detaillant-tabs" data-testid="detaillant-bottom-tabs" aria-label="Navigation">
      {DETAILLANT_TABS.map((tab) => {
        const active = tab.id === activeTab;
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
              {tab.icon === "messages" ? "✉" : tab.icon}
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
});
