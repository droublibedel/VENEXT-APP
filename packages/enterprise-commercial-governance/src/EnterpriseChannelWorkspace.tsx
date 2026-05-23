import type { EnterpriseCommercialChannel } from "./enterprise-governance.types";
import { getEnterpriseGovernanceTranslation } from "./enterprise-governance-i18n";

type Props = {
  channel: EnterpriseCommercialChannel;
  locale?: string;
};

export function EnterpriseChannelWorkspace({ channel, locale = "fr-CI" }: Props) {
  return (
    <section className="ecg-shell" data-testid="enterprise-channel-workspace">
      <h2 className="ecg-title">{getEnterpriseGovernanceTranslation("enterprise.channel.workspace", locale)}</h2>
      <p className="ecg-muted">{channel.companyName}</p>
      <dl style={{ margin: "12px 0 0", fontSize: 13 }}>
        <dt className="ecg-muted">Contrat</dt>
        <dd>{channel.contractReference}</dd>
        <dt className="ecg-muted">Statut gouvernance</dt>
        <dd>
          <span className="ecg-badge" data-testid="governance-status">
            {channel.governanceStatus}
          </span>
        </dd>
        <dt className="ecg-muted">Progression</dt>
        <dd data-testid="onboarding-progress">{channel.onboardingProgress}%</dd>
      </dl>
    </section>
  );
}
