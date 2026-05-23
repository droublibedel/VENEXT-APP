import { Injectable, Logger } from "@nestjs/common";

/**
 * Instruction 16A — unified domain → api-gateway HTTP fan-out (order-adv, supply-logistics, finance-collections).
 * Uses `VENEXT_API_GATEWAY_INTERNAL_URL` + `VENEXT_INTERNAL_REALTIME_KEY`; no-op when either is unset.
 */
@Injectable()
export class DomainRealtimeFanoutClient {
  private readonly log = new Logger(DomainRealtimeFanoutClient.name);

  isConfigured(): boolean {
    const base = process.env.VENEXT_API_GATEWAY_INTERNAL_URL?.trim();
    const key = process.env.VENEXT_INTERNAL_REALTIME_KEY?.trim();
    return Boolean(base && key);
  }

  /**
   * POST JSON to `{internalBase}{path}`. `path` must start with `/` (e.g. `/internal/v1/realtime/...`).
   * @returns true when HTTP 2xx, false when skipped, non-OK, or network error (Instruction 20.4B delivery honesty).
   */
  async postDomainSignal(path: string, payload: Record<string, unknown>): Promise<boolean> {
    const base = process.env.VENEXT_API_GATEWAY_INTERNAL_URL?.trim();
    const key = process.env.VENEXT_INTERNAL_REALTIME_KEY?.trim();
    if (!base || !key) {
      this.log.debug("domain realtime fan-out skipped: VENEXT_API_GATEWAY_INTERNAL_URL or VENEXT_INTERNAL_REALTIME_KEY unset");
      return false;
    }
    const root = base.replace(/\/$/, "");
    const rel = path.startsWith("/") ? path : `/${path}`;
    const url = `${root}${rel}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-venext-internal-key": key },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        this.log.warn(`domain realtime fan-out non-OK ${res.status} for ${rel}`);
        return false;
      }
      return true;
    } catch (e) {
      this.log.warn(`domain realtime fan-out failed ${rel}: ${(e as Error).message}`);
      return false;
    }
  }
}
