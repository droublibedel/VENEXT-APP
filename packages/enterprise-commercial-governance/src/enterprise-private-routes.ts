const PUBLIC_HOST_PATTERNS = [/localhost/i, /127\.0\.0\.1/];
const GUESSABLE_SLUG = /^(demo|test|admin|public|123|abc)$/i;

export class EnterprisePublicAccessError extends Error {
  constructor(message = "ENTERPRISE_ROUTE_NOT_PRIVATE") {
    super(message);
    this.name = "EnterprisePublicAccessError";
  }
}

export type PrivateRouteContext = {
  path: string;
  enterpriseId?: string;
  hasActiveSession: boolean;
  sessionEnterpriseId?: string;
  robotsIndexable?: boolean;
};

export function rejectPublicEnterpriseAccess(ctx: PrivateRouteContext): void {
  if (ctx.robotsIndexable) {
    throw new EnterprisePublicAccessError();
  }
  const lower = ctx.path.toLowerCase();
  if (lower.includes("/public/") || lower.includes("/signup") || lower.includes("/register")) {
    throw new EnterprisePublicAccessError();
  }
}

export function assertPrivateEnterpriseRoute(ctx: PrivateRouteContext): void {
  rejectPublicEnterpriseAccess(ctx);

  if (!ctx.path.includes("/e/") && !ctx.path.includes("venext.co")) {
    throw new EnterprisePublicAccessError();
  }

  const segments = ctx.path.split("/").filter(Boolean);
  const entSlug = segments.find((_, i) => segments[i - 1] === "e");
  if (entSlug && GUESSABLE_SLUG.test(entSlug)) {
    throw new EnterprisePublicAccessError();
  }

  if (!ctx.hasActiveSession) {
    throw new EnterprisePublicAccessError();
  }

  if (ctx.enterpriseId && ctx.sessionEnterpriseId && ctx.enterpriseId !== ctx.sessionEnterpriseId) {
    throw new EnterprisePublicAccessError();
  }
}

export function isEnterpriseRouteIndexable(path: string): boolean {
  return !path.includes("/e/");
}
