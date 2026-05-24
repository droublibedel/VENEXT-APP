import { memo } from "react";

import { buildActivityLabel } from "./commercial-activity-feed-intelligence";
import type { CommercialActivityItem } from "./commercial-activity-feed.types";
import { getActivityTranslation } from "./commercial-activity-feed-i18n";

type Props = {
  item: CommercialActivityItem;
  locale?: string;
  onOpen?: () => void;
};

export const CommercialActivityCard = memo(function CommercialActivityCard({
  item,
  locale = "fr-CI",
  onOpen,
}: Props) {
  const label = buildActivityLabel(item, locale);
  return (
    <article
      className={`caf-card${item.read ? "" : " caf-card--unread"}`}
      data-testid={`caf-card-${item.id}`}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <strong style={{ fontSize: 14, color: "#17201c" }}>{label}</strong>
        <span style={{ fontSize: 11, color: "#66746d" }}>
          {new Date(item.occurredAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      {onOpen && item.contextLink ? (
        <button type="button" onClick={onOpen} style={{ marginTop: 8, fontSize: 12, color: "#00a884" }}>
          {getActivityTranslation("activity.actions.open", locale)}
        </button>
      ) : null}
    </article>
  );
});
