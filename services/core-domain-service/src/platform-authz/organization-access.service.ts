import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { OrgMemberStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { devAuthBypassEnabled, isProductionRuntime } from "./venext-auth-context";
import type { VenextRequestActor } from "./venext-authz.types";

@Injectable()
export class OrganizationAccessService {
  private readonly log = new Logger(OrganizationAccessService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * When auth context exists, caller must be ACTIVE member of `organizationId`.
   * DEV_AUTH_BYPASS logs and allows. Non-production without headers allows (demo).
   */
  async assertMemberOrBypass(actor: VenextRequestActor, organizationId: string): Promise<void> {
    if (devAuthBypassEnabled()) {
      this.log.warn(`DEV_AUTH_BYPASS: org access check skipped (org=${organizationId})`);
      return;
    }
    if (!isProductionRuntime() && !actor.userId && !actor.organizationId) {
      return;
    }
    if (!actor.userId) {
      throw new ForbiddenException({ code: "venext_auth_missing_user", organizationId });
    }
    const m = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: actor.userId,
        status: OrgMemberStatus.ACTIVE,
      },
    });
    if (!m) {
      throw new ForbiddenException({ code: "venext_org_not_member", organizationId, userId: actor.userId });
    }
  }

  /** Header org must match route org param when auth is present (prevents cross-org IDOR). */
  assertHeaderOrgMatchesParam(actor: VenextRequestActor, paramOrgId: string): void {
    if (devAuthBypassEnabled()) {
      this.log.warn(`DEV_AUTH_BYPASS: header/param org match skipped (org=${paramOrgId})`);
      return;
    }
    if (!isProductionRuntime() && !actor.organizationId) return;
    if (actor.organizationId && actor.organizationId !== paramOrgId) {
      throw new ForbiddenException({
        code: "venext_org_param_mismatch",
        paramOrganizationId: paramOrgId,
        headerOrganizationId: actor.organizationId,
      });
    }
  }
}
