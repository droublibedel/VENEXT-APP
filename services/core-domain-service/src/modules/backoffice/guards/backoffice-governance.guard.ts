import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { devAuthBypassEnabled } from "../../../platform-authz/venext-auth-context";
import type { VenextHttpLike } from "../../../platform-authz/venext-auth-context";

const TOKEN_ENV = "VENEXT_BACKOFFICE_TOKEN";

/**
 * Governance command center access — shared token, future BACKOFFICE_ADMIN role, or DEV_AUTH_BYPASS (Instruction 10).
 */
@Injectable()
export class BackofficeGovernanceGuard implements CanActivate {
  private readonly log = new Logger(BackofficeGovernanceGuard.name);

  canActivate(ctx: ExecutionContext): boolean {
    if (devAuthBypassEnabled()) {
      this.log.warn("DEV_AUTH_BYPASS=true — backoffice governance guard allowing access (demo only)");
      return true;
    }
    const req = ctx.switchToHttp().getRequest<VenextHttpLike>();
    const roleRaw = req.headers["x-venext-user-role"] ?? req.headers["x-venext-role"];
    const role = typeof roleRaw === "string" ? roleRaw.trim() : Array.isArray(roleRaw) ? roleRaw[0]?.trim() : undefined;
    if (role === "BACKOFFICE_ADMIN") {
      return true;
    }
    const tokRaw = req.headers["x-venext-backoffice-token"];
    const token = typeof tokRaw === "string" ? tokRaw.trim() : Array.isArray(tokRaw) ? tokRaw[0]?.trim() : undefined;
    const expected = process.env[TOKEN_ENV]?.trim() || "dev-backoffice-token";
    if (token && token === expected) {
      return true;
    }
    throw new ForbiddenException({
      code: "backoffice_access_denied",
      hint: "Send x-venext-backoffice-token or x-venext-user-role: BACKOFFICE_ADMIN",
    });
  }
}
