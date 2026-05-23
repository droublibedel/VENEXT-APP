import type { CommerceErrorKey } from "commerce-humanized-errors/dist/commerce-humanized-errors.types.js";

import { isBackofficeFlagEnabled } from "../flags/backoffice-feature-flags.js";
import { reportUserFacingError, type ReportUserFacingErrorInput } from "../errors/error-pipeline.js";
import type { BackofficeErrorEvent } from "../types/error.types.js";

export type ReportBackofficeObservableErrorInput = ReportUserFacingErrorInput & {
  commerceErrorKey: CommerceErrorKey;
};

/** SDK interne — branche commerce-humanized-errors → back-office (Instruction BACKOFFICE-01). */
export async function reportBackofficeObservableError(
  input: ReportBackofficeObservableErrorInput,
): Promise<BackofficeErrorEvent | null> {
  const env = process.env.NODE_ENV === "production" ? "production" : "development";
  if (!isBackofficeFlagEnabled("backoffice_error_observability_enabled", env)) {
    return null;
  }
  return reportUserFacingError(input);
}
