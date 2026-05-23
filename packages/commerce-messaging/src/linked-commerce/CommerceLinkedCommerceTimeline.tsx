import { memo } from "react";

import type { CommerceLinkedTimelineStep } from "./commerce-linked-context.types";

export const CommerceLinkedCommerceTimeline = memo(function CommerceLinkedCommerceTimeline({
  steps,
  testId = "cm-linked-commerce-timeline",
}: {
  steps: CommerceLinkedTimelineStep[];
  testId?: string;
}) {
  return (
    <ol className="cm-linked-timeline" data-testid={testId}>
      {steps.map((step) => (
        <li
          key={step.id}
          className={`cm-linked-timeline-step cm-linked-timeline-step--${step.status}`}
          data-testid={`cm-linked-timeline-${step.id}`}
        >
          <span className="cm-linked-timeline-dot" aria-hidden />
          <div className="cm-linked-timeline-body">
            <strong>{step.label}</strong>
            {step.at ? <span className="cm-linked-timeline-at">{step.at}</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
});
