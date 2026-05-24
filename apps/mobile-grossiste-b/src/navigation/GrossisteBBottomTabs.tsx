import { memo } from "react";
import { Activity, Network, PackageSearch, ReceiptText } from "lucide-react";

import {
  GROSSISTE_B_BOTTOM_TABS,
  isGrossisteBBottomTab,
  type GrossisteBTabId,
} from "./grossiste-b-navigation.config";

type Props = {
  activeTab: GrossisteBTabId;
  onSelect: (tab: GrossisteBTabId) => void;
};

const icons = {
  activity: Activity,
  catalog: PackageSearch,
  orders: ReceiptText,
  network: Network,
} as const;

export const GrossisteBBottomTabs = memo(function GrossisteBBottomTabs({
  activeTab,
  onSelect,
}: Props) {
  return (
    <nav className="grossiste-b-tabs" data-testid="grossiste-bottom-tabs" aria-label="Navigation">
      {GROSSISTE_B_BOTTOM_TABS.map((tab) => {
        const active = isGrossisteBBottomTab(activeTab) && tab.id === activeTab;
        const Icon = icons[tab.icon];
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
              <Icon size={active ? 22 : 21} strokeWidth={1.85} />
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
});
