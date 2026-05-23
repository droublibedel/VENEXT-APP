export type JourneyStatus =
  | "STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ABANDONED"
  | "FAILED"
  | "BLOCKED";

export type JourneyFailureReason =
  | "OTP_FAILED"
  | "SESSION_EXPIRED"
  | "NETWORK"
  | "API_UNAVAILABLE"
  | "VALIDATION"
  | "ACCESS_DENIED"
  | "TIMEOUT"
  | "USER_LEFT"
  | "UNKNOWN";

export type JourneyDefinition = {
  journeyKey: string;
  labelFr: string;
  steps: JourneyStep[];
  application: string;
};

export type JourneyStep = {
  stepKey: string;
  labelFr: string;
  order: number;
};

export type JourneyEvent = {
  id: string;
  journeyId: string;
  journeyKey: string;
  actorId: string;
  actorRole: string;
  application: string;
  stepKey: string;
  at: string;
  metadata?: Record<string, unknown>;
};

export type BackofficeJourneyInstance = {
  journeyId: string;
  journeyKey: string;
  actorId: string;
  actorRole: string;
  application: string;
  startedAt: string;
  lastStepAt: string;
  completedAt?: string;
  currentStep: string;
  expectedNextStep?: string;
  status: JourneyStatus;
  failureReason?: JourneyFailureReason;
  linkedErrorEventId?: string;
  userId?: string;
  userPhone?: string;
  userEmail?: string;
  retryCount?: number;
};
