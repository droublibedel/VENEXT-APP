import type { InternalCommerceErrorLog } from "./commerce-humanized-errors.types";

const internalLog: InternalCommerceErrorLog[] = [];
const MAX_LOG = 200;

function isDev(): boolean {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env;
  if (env?.NODE_ENV === "production") return false;
  return true;
}

/** Journal interne — jamais affiché utilisateur (Instruction 20.84-A). */
export function logInternalCommerceError(input: Omit<InternalCommerceErrorLog, "at">): void {
  const entry: InternalCommerceErrorLog = {
    at: new Date().toISOString(),
    ...input,
  };
  internalLog.push(entry);
  if (internalLog.length > MAX_LOG) internalLog.shift();

  if (isDev()) {
    // eslint-disable-next-line no-console
    console.error("[commerce-humanized-errors]", entry);
  }
}

export function getInternalCommerceErrorLog(): readonly InternalCommerceErrorLog[] {
  return internalLog;
}

export function clearInternalCommerceErrorLog(): void {
  internalLog.length = 0;
}
