import type { EnterpriseInvitationMailTemplate } from "./enterprise-invitation-template";

type Props = {
  template: EnterpriseInvitationMailTemplate;
};

export function EnterpriseInvitationPreview({ template }: Props) {
  return (
    <article className="ecg-shell" data-testid="enterprise-invitation-preview">
      <h2 className="ecg-title">Aperçu invitation</h2>
      <p className="ecg-muted" data-testid="mail-subject">
        {template.subject}
      </p>
      <pre
        style={{ whiteSpace: "pre-wrap", fontSize: 12, marginTop: 8 }}
        data-testid="mail-body"
      >
        {template.body}
      </pre>
      <p data-testid="mail-code">Code : {template.activationCode}</p>
      <p data-testid="mail-url">{template.privateUrl}</p>
    </article>
  );
}
