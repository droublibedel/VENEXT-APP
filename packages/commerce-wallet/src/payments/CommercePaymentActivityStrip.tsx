import { memo } from "react";

import type { CommercePaymentActivity } from "../hooks/commerce-wallet.types";

export const CommercePaymentActivityStrip = memo(function CommercePaymentActivityStrip({
  activities,
  testId = "cw-activity-strip",
}: {
  activities: CommercePaymentActivity[];
  testId?: string;
}) {
  if (!activities.length) return null;
  return (
    <div className="cw-activity-strip" data-testid={testId}>
      {activities.map((a) => (
        <span
          key={a.id}
          className={`cw-activity-pill cw-activity-pill--${a.level}`}
          data-testid={`cw-activity-${a.id}`}
        >
          {a.text}
        </span>
      ))}
    </div>
  );
});
