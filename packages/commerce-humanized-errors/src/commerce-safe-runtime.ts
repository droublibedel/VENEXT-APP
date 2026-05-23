import { notifyBackofficeFromHumanizedError } from "./backoffice-reporter-hook.js";
import { humanizeCommerceError, humanizeCommerceErrorMessage } from "./commerce-humanized-errors";
import { mapHttpStatusToErrorKey } from "./commerce-error-mappers";
import { humanizeByKey } from "./commerce-humanized-errors";
import type { HumanizeErrorOptions, HumanizedCommerceError } from "./commerce-humanized-errors.types";

export type SafeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: HumanizedCommerceError };

export async function safeAsyncAction<T>(
  action: () => Promise<T>,
  options?: HumanizeErrorOptions,
): Promise<SafeResult<T>> {
  try {
    const data = await action();
    return { ok: true, data };
  } catch (e) {
    const error = humanizeCommerceError(e, options);
    if (options?.backofficeReport) {
      notifyBackofficeFromHumanizedError({
        commerceErrorKey: error.key,
        technicalMessage: error.message,
        internalStack: e instanceof Error ? e.stack : undefined,
        application: options.backofficeReport.application,
        screen: options.backofficeReport.screen ?? options.route,
        action: options.backofficeReport.action,
        routeOrApi: options.route,
        module: options.module,
        userId: options.backofficeReport.userId,
        userPhone: options.backofficeReport.userPhone,
        userEmail: options.backofficeReport.userEmail,
        actorId: options.backofficeReport.actorId,
        actorRole: options.backofficeReport.actorRole ?? options.actorRole,
      });
    }
    return { ok: false, error };
  }
}

export async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: HumanizeErrorOptions,
): Promise<SafeResult<Response>> {
  try {
    const res = await fetch(input, init);
    if (!res.ok) {
      const key = mapHttpStatusToErrorKey(res.status);
      return { ok: false, error: humanizeByKey(key, options?.locale) };
    }
    return { ok: true, data: res };
  } catch (e) {
    const error = humanizeCommerceError(e, { ...options, fallbackKey: "network_unstable" });
    if (options?.backofficeReport) {
      notifyBackofficeFromHumanizedError({
        commerceErrorKey: error.key,
        technicalMessage: error.message,
        application: options.backofficeReport.application,
        screen: options.backofficeReport.screen,
        routeOrApi: String(input),
        module: options.module ?? "network",
        userId: options.backofficeReport.userId,
        actorRole: options.backofficeReport.actorRole,
      });
    }
    return { ok: false, error };
  }
}

export function safeRender<T>(render: () => T, options?: HumanizeErrorOptions): SafeResult<T> {
  try {
    return { ok: true, data: render() };
  } catch (e) {
    return { ok: false, error: humanizeCommerceError(e, options) };
  }
}

export function safeRouteTransition(
  transition: () => void,
  options?: HumanizeErrorOptions,
): SafeResult<void> {
  try {
    transition();
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: humanizeCommerceError(e, options) };
  }
}

export function throwHumanized(error: unknown, options?: HumanizeErrorOptions): never {
  const h = humanizeCommerceError(error, options);
  const err = new Error(h.message);
  (err as Error & { humanized: HumanizedCommerceError }).humanized = h;
  throw err;
}

export function extractHumanMessage(error: unknown, options?: HumanizeErrorOptions): string {
  if (error && typeof error === "object" && "humanized" in error) {
    const h = (error as { humanized?: HumanizedCommerceError }).humanized;
    if (h?.message) return h.message;
  }
  return humanizeCommerceErrorMessage(error, options);
}
