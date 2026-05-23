export type BackofficeSession = {
  token: string;
  email: string;
  operatorId: string;
  createdAt: string;
  expiresAt: string;
};

export type BackofficeOtpChallenge = {
  email: string;
  code: string;
  expiresAt: string;
  attempts: number;
};
