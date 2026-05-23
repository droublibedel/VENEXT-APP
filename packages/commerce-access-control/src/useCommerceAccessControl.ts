import { useMemo } from "react";

import { buildAccessContext } from "./commerce-access-control-context";
import type { BuildAccessContextInput } from "./commerce-access-control-context";
import { evaluateCommercePermissions } from "./commerce-access-control-permissions";
import type { CommercePermissions } from "./commerce-access-control.types";

export function useCommerceAccessControl(input: BuildAccessContextInput): {
  permissions: CommercePermissions;
  context: ReturnType<typeof buildAccessContext>;
} {
  const context = useMemo(() => buildAccessContext(input), [input]);
  const permissions = useMemo(
    () => evaluateCommercePermissions(context),
    [context],
  );
  return { permissions, context };
}
