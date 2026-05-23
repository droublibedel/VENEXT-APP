import { Injectable, Logger } from "@nestjs/common";

import { CommercialTrustComputationService } from "./commercial-trust-computation.service";

/**
 * Instruction 20.3 — batches trust recomputes to avoid one Prisma scan per chat line.
 */
@Injectable()
export class CommercialTrustTouchService {
  private readonly log = new Logger(CommercialTrustTouchService.name);
  private readonly pending = new Set<string>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly computation: CommercialTrustComputationService) {}

  touchOrganizations(organizationIds: string[]): void {
    for (const raw of organizationIds) {
      const id = raw?.trim();
      if (id) this.pending.add(id);
    }
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush();
    }, 450);
  }

  private async flush(): Promise<void> {
    const batch = [...this.pending];
    this.pending.clear();
    if (batch.length === 0) return;
    this.log.log(
      JSON.stringify({ job: "commercial_trust_touch", phase: "flush_started", organizationCount: batch.length }),
    );
    for (const orgId of batch) {
      try {
        await this.computation.computeAndPersist(orgId);
      } catch (e) {
        this.log.warn(
          JSON.stringify({
            job: "commercial_trust_touch",
            phase: "flush_item_failed",
            organizationId: orgId,
            error: String((e as Error).message),
          }),
        );
      }
    }
    this.log.log(JSON.stringify({ job: "commercial_trust_touch", phase: "flush_completed", organizationCount: batch.length }));
  }
}
