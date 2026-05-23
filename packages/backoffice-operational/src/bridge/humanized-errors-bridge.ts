import {
  registerBackofficeHumanizedErrorReporter,
  type BackofficeReporterPayload,
} from "commerce-humanized-errors/dist/backoffice-reporter-hook.js";

import { reportBackofficeObservableError } from "../sdk/report-backoffice-observable-error.js";

let wired = false;

export function wireCommerceHumanizedErrorsToBackoffice(): void {
  if (wired) return;
  wired = true;
  registerBackofficeHumanizedErrorReporter((payload: BackofficeReporterPayload) => {
    void reportBackofficeObservableError(payload);
  });
}
