import { memo } from "react";

import type { SettlementTimelineStep } from "./commerce-settlement.types";

export const CommerceSettlementTimeline = memo(function CommerceSettlementTimeline({
  steps,
  testId = "cw-settlement-timeline",
}: {
  steps: SettlementTimelineStep[];
  testId?: string;
}) {
  return (
    <ol className="cw-timeline" data-testid={testId}>
      {steps.map((step) => (
        <li
          key={step.id}
          className={`cw-timeline-step cw-timeline-step--${step.status}`}
          data-testid={`cw-timeline-${step.id}`}
        >
          <span className="cw-timeline-dot" aria-hidden />
          <div className="cw-timeline-body">
            <strong>{step.label}</strong>
            {step.at ? <span className="cw-timeline-at">{step.at}</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
});
