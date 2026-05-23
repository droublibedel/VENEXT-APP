import { memo } from "react";

import { GROSSISTE_B_TABS, type GrossisteBTabId } from "./grossiste-b-navigation.config";

type Props = {
  activeTab: GrossisteBTabId;
  onSelect: (tab: GrossisteBTabId) => void;
};

export const GrossisteBBottomTabs = memo(function GrossisteBBottomTabs({
  activeTab,
  onSelect,
}: Props) {
  return (
    <nav className="grossiste-b-tabs" data-testid="grossiste-bottom-tabs" aria-label="Navigation">
      {GROSSISTE_B_TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            className={`grossiste-b-tab${active ? " grossiste-b-tab--active" : ""}`}
            data-testid={tab.testId}
            aria-current={active ? "page" : undefined}
            onClick={() => onSelect(tab.id)}
          >
            <span className="grossiste-b-tab-icon" aria-hidden>
              {tab.icon === "messages" ? "✉" : tab.icon}
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
});
