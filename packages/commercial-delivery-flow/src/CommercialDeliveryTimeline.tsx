"use client";

import { memo } from "react";

import type { DeliveryTimelineStep } from "./commercial-delivery-flow.types";

function CommercialDeliveryTimelineInner({ steps }: { steps: DeliveryTimelineStep[] }) {
  return (
    <ol className="cdf-timeline" data-testid="cdf-delivery-timeline" aria-label="Timeline livraison terrain">
      {steps.map((step) => (
        <li
          key={step.id}
          className={`cdf-timeline-step cdf-timeline-step--${step.status}`}
          data-testid={`cdf-timeline-${step.id}`}
        >
          <span className="cdf-timeline-dot" aria-hidden />
          <span className="cdf-timeline-label">{step.label}</span>
          {step.at ? <span className="cdf-timeline-at">{step.at}</span> : null}
        </li>
      ))}
    </ol>
  );
}

export const CommercialDeliveryTimeline = memo(CommercialDeliveryTimelineInner);
