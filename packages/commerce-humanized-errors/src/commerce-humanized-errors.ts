import { sanitizeCommerceFoundationText } from "commerce-foundation-guardrails";

import { getHumanizedErrorCopy } from "./commerce-error-i18n";
import { mapThrownErrorToErrorKey } from "./commerce-error-mappers";
import { recoveryActionsForKey } from "./commerce-error-recovery";
import { severityForErrorKey } from "./commerce-error-severity";
import { notifyBackofficeFromHumanizedError } from "./backoffice-reporter-hook";
import { logInternalCommerceError } from "./commerce-error-internal-logger";
import type {
  CommerceErrorKey,
  HumanizeErrorOptions,
  HumanizedCommerceError,
} from "./commerce-humanized-errors.types";

/** Patterns interdits à l’écran utilisateur (Instruction 20.84-A). */
const FORBIDDEN_VISIBLE =
  /\b(\d{3}\s+(not found|internal server|forbidden|unauthorized)|stack trace|syntaxerror|typeerror|referenceerror|unexpected token|cannot read propert|undefined is not|null is not|at\s+[\w.]+\s*\(|\.tsx?:\d+|\.ts:\d+|prisma|axios|network error|failed to fetch|internal server error|json parse|fraud|security violation)\b/i;

const JSON_LIKE = /^\s*[\[{]/;

export function isTechnicalErrorVisible(text: string): boolean {
  if (!text || text.length > 280) return true;
  if (FORBIDDEN_VISIBLE.test(text)) return true;
  if (JSON_LIKE.test(text)) return true;
  if (/^\s*\d{3}\b/.test(text)) return true;
  if (/cannot read propert|unexpected token|network error/i.test(text)) return true;
  if (text.includes("at Object.") || text.includes("webpack")) return true;
  return false;
}

export function sanitizeVisibleErrorText(text: string, locale = "fr-CI"): string {
  const trimmed = text?.trim() ?? "";
  if (!trimmed || isTechnicalErrorVisible(trimmed)) {
    return getHumanizedErrorCopy("generic", locale).message;
  }
  return sanitizeCommerceFoundationText(trimmed);
}

export function humanizeCommerceError(
  error: unknown,
  options: HumanizeErrorOptions = {},
): HumanizedCommerceError {
  const locale = options.locale ?? "fr-CI";
  const mapped = mapThrownErrorToErrorKey(error);
  const key = mapped !== "unexpected" ? mapped : (options.fallbackKey ?? "generic");

  const copy = getHumanizedErrorCopy(key, locale);
  const recovery = recoveryActionsForKey(key);
  const severity = severityForErrorKey(key);

  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : JSON.stringify(error);

  logInternalCommerceError({
    key,
    rawMessage: raw,
    stack: error instanceof Error ? error.stack : undefined,
    module: options.module,
    route: options.route,
    actorRole: options.actorRole,
  });

  if (options.backofficeReport?.application) {
    notifyBackofficeFromHumanizedError({
      commerceErrorKey: key,
      technicalMessage: raw,
      internalStack: error instanceof Error ? error.stack : undefined,
      application: options.backofficeReport.application,
      screen: options.backofficeReport.screen,
      action: options.backofficeReport.action,
      routeOrApi: options.route,
      module: options.module,
      userId: options.backofficeReport.userId,
      userPhone: options.backofficeReport.userPhone,
      userEmail: options.backofficeReport.userEmail,
      actorId: options.backofficeReport.actorId,
      actorRole: options.actorRole,
    });
  }

  return {
    key,
    title: sanitizeCommerceFoundationText(copy.title),
    message: sanitizeCommerceFoundationText(copy.message),
    severity,
    recovery,
    recoverable: severity !== "blocking",
  };
}

export function humanizeCommerceErrorMessage(
  error: unknown,
  options?: HumanizeErrorOptions,
): string {
  return humanizeCommerceError(error, options).message;
}

/** Message UI depuis une exception catch — jamais de texte technique brut (20.84-B). */
export function humanizeCaughtError(
  error: unknown,
  options?: HumanizeErrorOptions,
): string {
  return humanizeCommerceErrorMessage(error, options);
}

export function humanizeByKey(
  key: CommerceErrorKey,
  locale = "fr-CI",
): HumanizedCommerceError {
  const copy = getHumanizedErrorCopy(key, locale);
  return {
    key,
    title: copy.title,
    message: copy.message,
    severity: severityForErrorKey(key),
    recovery: recoveryActionsForKey(key),
    recoverable: severityForErrorKey(key) !== "blocking",
  };
}
