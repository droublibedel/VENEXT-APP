import { devAuthBypassEnabled, type VenextHttpLike } from "../../platform-authz/venext-auth-context";
import type { VenextRequestActor } from "../../platform-authz/venext-authz.types";

export type BackofficeCartOverrideDiagnostics = {
  backofficeOverrideRequested: boolean;
  backofficeOverrideGranted: boolean;
  backofficeOverrideSource: "none" | "backoffice_actor" | "internal_token" | "dev_bypass";
};

export type BackofficeCartOverrideResolution = {
  allowRestrictedCommerceForBackoffice: boolean;
  diagnostics: BackofficeCartOverrideDiagnostics;
};

const OVERRIDE_HEADER = "x-venext-restricted-commerce-override";

function headerSingle(req: VenextHttpLike, name: string): string | undefined {
  const v = req.headers[name] ?? req.headers[name.toLowerCase()];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (Array.isArray(v) && typeof v[0] === "string" && v[0].trim()) return v[0].trim();
  return undefined;
}

/**
 * Instruction 20.5A — RESTRICTED corridor commerce override must never be granted from participant body alone.
 * Grant only with verified backoffice actor + explicit header, or valid internal service key.
 */
export function resolveBackofficeCartOverride(
  actor: VenextRequestActor,
  request: VenextHttpLike,
  bodyRequested?: boolean,
): BackofficeCartOverrideResolution {
  const expectedInt = process.env.VENEXT_INTERNAL_REALTIME_KEY?.trim();
  const intKey = headerSingle(request, "x-venext-internal-key");
  const internalOk = Boolean(expectedInt && intKey === expectedInt);

  const requested = bodyRequested === true;

  if (internalOk) {
    return {
      allowRestrictedCommerceForBackoffice: true,
      diagnostics: {
        backofficeOverrideRequested: requested,
        backofficeOverrideGranted: true,
        backofficeOverrideSource: "internal_token",
      },
    };
  }

  const overrideHeader = headerSingle(request, OVERRIDE_HEADER);
  const headerGranted = overrideHeader === "granted";

  if (actor.backofficeCommercialTrustFull) {
    const granted = headerGranted;
    return {
      allowRestrictedCommerceForBackoffice: granted,
      diagnostics: {
        backofficeOverrideRequested: requested || headerGranted,
        backofficeOverrideGranted: granted,
        backofficeOverrideSource: granted ? "backoffice_actor" : "none",
      },
    };
  }

  const devDiag = devAuthBypassEnabled() && requested;
  return {
    allowRestrictedCommerceForBackoffice: false,
    diagnostics: {
      backofficeOverrideRequested: requested,
      backofficeOverrideGranted: false,
      backofficeOverrideSource: devDiag ? "dev_bypass" : "none",
    },
  };
}
