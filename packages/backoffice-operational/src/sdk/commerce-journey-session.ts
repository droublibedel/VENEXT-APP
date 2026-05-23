export type ActiveCommerceJourney = {
  journeyId: string;
  journeyKey: string;
  step: string;
  screen?: string;
  action?: string;
  module?: string;
};

let active: ActiveCommerceJourney | null = null;

export function setActiveCommerceJourney(
  journeyId: string,
  ctx: Pick<ActiveCommerceJourney, "journeyKey" | "step" | "screen" | "action" | "module">,
): void {
  active = {
    journeyId,
    journeyKey: ctx.journeyKey,
    step: ctx.step,
    screen: ctx.screen,
    action: ctx.action,
    module: ctx.module,
  };
}

export function updateActiveCommerceJourneyStep(
  step: string,
  partial?: Partial<Pick<ActiveCommerceJourney, "screen" | "action" | "module">>,
): void {
  if (!active) return;
  active.step = step;
  if (partial?.screen) active.screen = partial.screen;
  if (partial?.action) active.action = partial.action;
  if (partial?.module) active.module = partial.module;
}

export function clearActiveCommerceJourney(): void {
  active = null;
}

export function getActiveCommerceJourney(): ActiveCommerceJourney | null {
  return active ? { ...active } : null;
}

export function getActiveCommerceJourneyId(): string | undefined {
  return active?.journeyId;
}

export function resetCommerceJourneySessionForTests(): void {
  active = null;
}
