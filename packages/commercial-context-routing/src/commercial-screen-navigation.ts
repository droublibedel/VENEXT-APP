import type { CommercialActorRole } from "commercial-relationship-governance";

import { resolveActorScreenDestination, type ScreenNavigationPayload } from "./commercial-actor-destinations";
import { isScreenNavigationAllowed } from "./commercial-navigation-governance";
import type {
  CommercialContextReference,
  CommercialContextRoutingFlags,
  CommercialNavigationIntent,
} from "./commercial-context-routing.types";
import {
  screenIntentFromNavigationIntent,
  type CommercialScreenIntent,
} from "./commercial-screen-intent";
import { sanitizeCommercialNavigationLabel } from "./commercial-context-resolution";

export function buildScreenNavigationPayload(
  actor: CommercialActorRole,
  intent: CommercialNavigationIntent,
  flags: CommercialContextRoutingFlags = {},
): ScreenNavigationPayload | null {
  const screenIntent = screenIntentFromNavigationIntent(intent);
  if (!screenIntent) return null;

  const gate = isScreenNavigationAllowed(actor, screenIntent, intent.reference, flags);
  if (!gate.allowed) return null;

  const destination = resolveActorScreenDestination(actor, screenIntent);
  if (!destination) return null;

  return {
    screenIntent,
    reference: intent.reference,
    destination,
    label: sanitizeCommercialNavigationLabel(intent.label),
  };
}

export function applyScreenIntent(
  actor: CommercialActorRole,
  screenIntent: CommercialScreenIntent,
  reference: CommercialContextReference,
  flags: CommercialContextRoutingFlags = {},
): ScreenNavigationPayload | null {
  const gate = isScreenNavigationAllowed(actor, screenIntent, reference, flags);
  if (!gate.allowed) return null;

  const destination = resolveActorScreenDestination(actor, screenIntent);
  if (!destination) return null;

  return {
    screenIntent,
    reference,
    destination,
    label: sanitizeCommercialNavigationLabel(`Navigation — ${screenIntent}`),
  };
}
