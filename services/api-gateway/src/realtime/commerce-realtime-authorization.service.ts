import { Injectable, Logger } from "@nestjs/common";

export type CommerceWsSubscribeValidationResult = {
  authorized: boolean;
  realtimeAuthorizationValidated: boolean;
  wsThreadScopeValidated: boolean;
  actorResolvedFrom?: string;
  bodyActorTrusted?: false;
  threadMembershipValidated?: boolean;
  threadWriteValidated?: boolean;
  commercialConsistencyValidated?: boolean;
  rejectedByThreadAccessCount?: number;
  rejectedByOrganizationMismatch?: number;
  rejectedByRelationshipMismatch?: number;
};

/**
 * Instruction 20.1B — gateway calls core-domain to validate commerce WS thread subscribe (membership + corridor).
 */
@Injectable()
export class CommerceRealtimeAuthorizationService {
  private readonly log = new Logger(CommerceRealtimeAuthorizationService.name);

  async validateCommerceThreadSubscribe(params: {
    threadId: string;
    userId: string;
    organizationId: string;
  }): Promise<CommerceWsSubscribeValidationResult> {
    const base = (process.env.VENEXT_CORE_DOMAIN_HTTP_URL ?? process.env.CORE_DOMAIN_URL ?? "http://127.0.0.1:3200").replace(
      /\/$/,
      "",
    );
    const key = process.env.VENEXT_INTERNAL_REALTIME_KEY?.trim();
    if (!key) {
      this.log.warn("VENEXT_INTERNAL_REALTIME_KEY unset — commerce WS core validation unavailable");
      return {
        authorized: false,
        realtimeAuthorizationValidated: false,
        wsThreadScopeValidated: false,
      };
    }
    const url = `${base}/v1/internal/commerce-messaging/ws-subscribe-validate`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-venext-internal-key": key,
        },
        body: JSON.stringify({
          threadId: params.threadId,
          userId: params.userId,
          organizationId: params.organizationId,
        }),
      });
      if (!res.ok) {
        this.log.warn(`Core commerce WS validate HTTP ${res.status}`);
        return {
          authorized: false,
          realtimeAuthorizationValidated: true,
          wsThreadScopeValidated: false,
        };
      }
      return (await res.json()) as CommerceWsSubscribeValidationResult;
    } catch (e) {
      this.log.warn(`Core commerce WS validate failed: ${e instanceof Error ? e.message : String(e)}`);
      return {
        authorized: false,
        realtimeAuthorizationValidated: false,
        wsThreadScopeValidated: false,
      };
    }
  }
}
