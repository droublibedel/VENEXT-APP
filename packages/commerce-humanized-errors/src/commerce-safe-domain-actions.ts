import { safeAsyncAction, type SafeResult } from "./commerce-safe-runtime";
import type { HumanizeErrorOptions, HumanizedCommerceError } from "./commerce-humanized-errors.types";

function domainOptions(module: string, extra?: HumanizeErrorOptions): HumanizeErrorOptions {
  return { module, ...extra };
}

export async function safeWalletAction<T>(
  action: () => Promise<T>,
  options?: HumanizeErrorOptions,
): Promise<SafeResult<T>> {
  return safeAsyncAction(action, {
    ...domainOptions("wallet", options),
    fallbackKey: options?.fallbackKey ?? "wallet_action_failed",
  });
}

export async function safeMessagingAction<T>(
  action: () => Promise<T>,
  options?: HumanizeErrorOptions,
): Promise<SafeResult<T>> {
  return safeAsyncAction(action, {
    ...domainOptions("messaging", options),
    fallbackKey: options?.fallbackKey ?? "message_not_sent",
  });
}

export async function safeCatalogAction<T>(
  action: () => Promise<T>,
  options?: HumanizeErrorOptions,
): Promise<SafeResult<T>> {
  return safeAsyncAction(action, {
    ...domainOptions("catalog", options),
    fallbackKey: options?.fallbackKey ?? "catalog_unavailable",
  });
}

export async function safeNotificationAction<T>(
  action: () => Promise<T>,
  options?: HumanizeErrorOptions,
): Promise<SafeResult<T>> {
  return safeAsyncAction(action, {
    ...domainOptions("notifications", options),
    fallbackKey: options?.fallbackKey ?? "sync_failed",
  });
}

export async function safeEnterpriseGovernanceAction<T>(
  action: () => Promise<T>,
  options?: HumanizeErrorOptions,
): Promise<SafeResult<T>> {
  return safeAsyncAction(action, {
    ...domainOptions("enterprise-governance", options),
    fallbackKey: options?.fallbackKey ?? "access_denied",
  });
}

export function humanizedErrorFromSafeResult<T>(
  result: SafeResult<T>,
): HumanizedCommerceError | undefined {
  return result.ok ? undefined : result.error;
}
