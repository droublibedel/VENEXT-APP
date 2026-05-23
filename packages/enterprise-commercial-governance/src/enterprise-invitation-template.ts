export type EnterpriseInvitationMailTemplate = {
  subject: string;
  body: string;
  activationCode: string;
  privateUrl: string;
  poleLabel: string;
  companyName: string;
};

export function buildEnterpriseInvitationTemplate(input: {
  companyName: string;
  poleLabel: string;
  privateUrl: string;
  activationCode: string;
  locale?: string;
}): EnterpriseInvitationMailTemplate {
  const locale = input.locale ?? "fr-CI";
  if (locale.startsWith("en")) {
    return {
      subject: `VENEXT — Secure access (${input.poleLabel})`,
      body: `Hello,\n\nYour supervised industrial access for ${input.companyName} is ready.\n\nPole: ${input.poleLabel}\nPrivate link: ${input.privateUrl}\nActivation code: ${input.activationCode}\n\nThis link is unique and expires automatically.\n\n— VENEXT Commercial Team`,
      activationCode: input.activationCode,
      privateUrl: input.privateUrl,
      poleLabel: input.poleLabel,
      companyName: input.companyName,
    };
  }
  return {
    subject: `VENEXT — Accès sécurisé (${input.poleLabel})`,
    body: `Bonjour,\n\nVotre accès industriel supervisé pour ${input.companyName} est prêt.\n\nPôle : ${input.poleLabel}\nLien privé : ${input.privateUrl}\nCode d'activation : ${input.activationCode}\n\nCe lien est unique et expire automatiquement.\n\n— Équipe commerciale VENEXT`,
    activationCode: input.activationCode,
    privateUrl: input.privateUrl,
    poleLabel: input.poleLabel,
    companyName: input.companyName,
  };
}
