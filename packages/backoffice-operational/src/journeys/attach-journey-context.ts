import type { BackofficeErrorEvent } from "../types/error.types.js";
import { getBackofficeJourneyRepository } from "../repositories/backoffice-journey.repository.js";

export async function attachJourneyContextToError(
  error: BackofficeErrorEvent,
  journeyId?: string,
): Promise<BackofficeErrorEvent> {
  const targetJourneyId = journeyId ?? error.journeyId;
  if (!targetJourneyId) return error;

  const journey = await getBackofficeJourneyRepository().getById(targetJourneyId);
  if (!journey) return error;

  error.journeyId = journey.journeyId;
  error.commercialContext = {
    ...error.commercialContext,
    journeyKey: journey.journeyKey,
    journeyStatus: journey.status,
    journeyStep: journey.currentStep,
    actorId: journey.actorId,
    actorRole: journey.actorRole,
  };
  if (!error.userId && journey.userId) error.userId = journey.userId;
  if (!error.userPhone && journey.userPhone) error.userPhone = journey.userPhone;

  return error;
}
