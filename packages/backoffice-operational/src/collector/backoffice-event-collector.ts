import { getBackofficeStore } from "../store/backoffice-store.js";
import type { BackofficeErrorEvent } from "../types/error.types.js";
import type { BackofficeJourneyInstance } from "../types/journey.types.js";

export type BackofficeCollectedEvent =
  | { type: "error"; payload: BackofficeErrorEvent }
  | { type: "journey"; payload: BackofficeJourneyInstance }
  | { type: "health"; payload: Record<string, unknown> }
  | { type: "governance"; payload: Record<string, unknown> };

/** Collecteur léger — pas de surveillance abusive (Instruction BACKOFFICE-01). */
export class BackofficeEventCollector {
  private static instance: BackofficeEventCollector | null = null;
  private readonly buffer: BackofficeCollectedEvent[] = [];
  private readonly max = 500;

  static shared(): BackofficeEventCollector {
    if (!this.instance) this.instance = new BackofficeEventCollector();
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }

  emit(event: BackofficeCollectedEvent): void {
    this.buffer.unshift(event);
    if (this.buffer.length > this.max) this.buffer.length = this.max;
  }

  emitError(payload: BackofficeErrorEvent): void {
    this.emit({ type: "error", payload });
    if (payload.severity === "critical") {
      getBackofficeStore().pushNotification("critical", `Erreur critique : ${payload.errorType}`);
    }
  }

  emitJourney(payload: BackofficeJourneyInstance): void {
    this.emit({ type: "journey", payload });
  }

  recent(limit = 50): BackofficeCollectedEvent[] {
    return this.buffer.slice(0, limit);
  }

  clear(): void {
    this.buffer.length = 0;
  }
}
