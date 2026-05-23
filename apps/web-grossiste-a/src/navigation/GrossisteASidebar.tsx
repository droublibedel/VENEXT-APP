import { memo } from "react";

import { GROSSISTE_A_NAV, type GrossisteAWorkspaceId } from "./grossiste-a-navigation.config";

export const GrossisteASidebar = memo(function GrossisteASidebar({
  active,
  onSelect,
}: {
  active: GrossisteAWorkspaceId;
  onSelect: (id: GrossisteAWorkspaceId) => void;
}) {
  return (
    <aside className="ga-sidebar" data-testid="grossiste-a-sidebar" aria-label="Navigation Grossiste A">
      <p style={{ margin: "0 0 16px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#00a884" }}>
        VENEXT · GROSSISTE A
      </p>
      {GROSSISTE_A_NAV.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`ga-nav-item${active === item.id ? " ga-nav-item--active" : ""}`}
          data-testid={item.testId}
          aria-current={active === item.id ? "page" : undefined}
          onClick={() => onSelect(item.id)}
        >
          {item.icon === "messages" ? <span aria-hidden>✉ </span> : null}
          {item.label}
        </button>
      ))}
    </aside>
  );
});
