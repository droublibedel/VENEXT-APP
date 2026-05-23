import { Body, Controller, Post, UnauthorizedException, Headers } from "@nestjs/common";

import { SponsoredConversationExpirationService } from "./sponsored-conversation-expiration.service";
import { SponsoredRelationshipModerationHookService } from "./sponsored-relationship-moderation-hook.service";

/**
 * Instruction 20.2B — maintenance interne (cron / back-office / ops).
 * Préfixe Nest global `v1` → URL effective : `/v1/internal/v1/sponsored-discovery/maintenance/...`
 */
@Controller("internal/v1/sponsored-discovery/maintenance")
export class InternalSponsoredDiscoveryMaintenanceController {
  constructor(
    private readonly expiration: SponsoredConversationExpirationService,
    private readonly moderationHook: SponsoredRelationshipModerationHookService,
  ) {}

  @Post("expire-due-windows")
  async expireDueWindows(@Headers("x-venext-internal-key") key: string | undefined) {
    this.assertKey(key);
    const out = await this.expiration.expireDueWindows(new Date());
    return out;
  }

  @Post("sync-relationship")
  async syncRelationship(
    @Headers("x-venext-internal-key") key: string | undefined,
    @Body() body: { relationshipId: string },
  ) {
    this.assertKey(key);
    const relationshipId = body.relationshipId?.trim();
    if (!relationshipId) {
      return { ok: false, error: "relationshipId_required" };
    }
    return this.moderationHook.handleRelationshipModerationDecision(relationshipId);
  }

  private assertKey(key: string | undefined) {
    const expect =
      process.env.VENEXT_INTERNAL_SPONSORED_MAINTENANCE_KEY?.trim() ||
      process.env.VENEXT_INTERNAL_REALTIME_KEY?.trim();
    if (!expect || key !== expect) {
      throw new UnauthorizedException();
    }
  }
}
