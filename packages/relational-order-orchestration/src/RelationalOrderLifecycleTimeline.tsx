"use client";

import { memo } from "react";

import type { OrderTimelineStep } from "./relational-order-orchestration.types";

function RelationalOrderLifecycleTimelineInner({ steps }: { steps: OrderTimelineStep[] }) {
  return (
    <ol className="roo-timeline" data-testid="roo-lifecycle-timeline" aria-label="Cycle commercial commande">
      {steps.map((step) => (
        <li
          key={step.id}
          className={`roo-timeline-step roo-timeline-step--${step.status}`}
          data-testid={`roo-timeline-${step.id}`}
        >
          <span className="roo-timeline-dot" aria-hidden />
          <span className="roo-timeline-label">{step.label}</span>
          {step.at ? <span className="roo-timeline-at">{step.at}</span> : null}
        </li>
      ))}
    </ol>
  );
}

export const RelationalOrderLifecycleTimeline = memo(RelationalOrderLifecycleTimelineInner);
