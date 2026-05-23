import { humanizeCommerceError } from "./commerce-humanized-errors";
import { logInternalCommerceError } from "./commerce-error-internal-logger";

export type HumanizedGlobalHandlerOptions = {
  locale?: string;
  module?: string;
};

/** Empêche l’affichage d’erreurs brutes non gérées (Instruction 20.84-A). */
export function installCommerceHumanizedGlobalHandlers(
  options: HumanizedGlobalHandlerOptions = {},
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onError = (event: ErrorEvent) => {
    const h = humanizeCommerceError(event.error ?? event.message, {
      locale: options.locale,
      module: options.module ?? "global",
      fallbackKey: "runtime_error",
    });
    logInternalCommerceError({
      key: h.key,
      rawMessage: String(event.message),
      stack: event.error instanceof Error ? event.error.stack : undefined,
      module: options.module,
    });
    event.preventDefault();
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    humanizeCommerceError(event.reason, {
      locale: options.locale,
      module: options.module ?? "unhandled-rejection",
      fallbackKey: "unexpected",
    });
    event.preventDefault();
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
