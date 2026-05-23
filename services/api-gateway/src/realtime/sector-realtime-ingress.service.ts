import { Injectable } from "@nestjs/common";

/**
 * Instruction 20.24 — idempotence + debounce for relational.sector.* ingress (gateway boundary).
 */
@Injectable()
export class SectorRealtimeIngressCoordinator {
  private readonly eventIdSeen = new Map<string, number>();
  private readonly fingerprintBurst = new Map<string, number>();
  private readonly ttlMs = 120_000;
  private readonly debounceMs = 220;

  allowStructured(
    organizationId: string,
    eventType: string,
    body: Record<string, unknown>,
  ): { accept: true } | { accept: false; reason: "duplicate_event_id" | "debounced_fingerprint" } {
    const now = Date.now();
    this.prune(now);
    const eventId = typeof body.eventId === "string" ? body.eventId : "";
    const fingerprint = typeof body.fingerprint === "string" ? body.fingerprint : "";
    if (eventId) {
      const k = `${organizationId}:${eventId}`;
      if (this.eventIdSeen.has(k)) return { accept: false, reason: "duplicate_event_id" };
      this.eventIdSeen.set(k, now);
    }
    if (eventId && fingerprint) {
      const k2 = `${organizationId}:${eventType}:${fingerprint}`;
      const last = this.fingerprintBurst.get(k2) ?? 0;
      if (now - last < this.debounceMs) return { accept: false, reason: "debounced_fingerprint" };
      this.fingerprintBurst.set(k2, now);
    }
    return { accept: true };
  }

  private prune(now: number): void {
    for (const [k, t] of this.eventIdSeen) {
      if (now - t > this.ttlMs) this.eventIdSeen.delete(k);
    }
    for (const [k, t] of this.fingerprintBurst) {
      if (now - t > this.ttlMs) this.fingerprintBurst.delete(k);
    }
  }
}
