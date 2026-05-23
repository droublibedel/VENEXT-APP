import { ENTERPRISE_ONBOARDING_STEPS } from "./enterprise-onboarding-workflow";
import type { EnterpriseOnboardingStepId } from "./enterprise-governance.types";
import { getEnterpriseGovernanceTranslation } from "./enterprise-governance-i18n";

type Props = {
  completedStepIds?: EnterpriseOnboardingStepId[];
  locale?: string;
};

export function EnterpriseOnboardingTimeline({ completedStepIds = [], locale = "fr-CI" }: Props) {
  const done = new Set(completedStepIds);
  return (
    <section className="ecg-shell" data-testid="enterprise-onboarding-timeline">
      <h2 className="ecg-title">
        {getEnterpriseGovernanceTranslation("enterprise.onboarding.timeline", locale)}
      </h2>
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {ENTERPRISE_ONBOARDING_STEPS.map((step, idx) => (
          <li key={step.id} className="ecg-timeline-step" data-testid={`onboarding-step-${step.id}`}>
            <span className="ecg-badge">{idx + 1}</span>
            <span style={{ flex: 1 }}>{step.label}</span>
            {done.has(step.id) ? (
              <span className="ecg-badge" data-testid={`step-done-${step.id}`}>
                OK
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
