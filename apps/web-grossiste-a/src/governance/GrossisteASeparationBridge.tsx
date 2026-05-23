import { useEffect } from "react";
import {
  assertGrossisteASeparation,
  poleForGrossisteAWorkspace,
} from "enterprise-commercial-governance";

import type { GrossisteAWorkspaceId } from "../navigation/grossiste-a-navigation.config";

/** Vérifie que le workspace actif reste dans le périmètre Grossiste A (Instruction 20.86-C). */
export function GrossisteASeparationBridge({ activeWorkspace }: { activeWorkspace: GrossisteAWorkspaceId }) {
  useEffect(() => {
    const pole = poleForGrossisteAWorkspace(activeWorkspace);
    if (pole) {
      assertGrossisteASeparation("GROSSISTE_A", pole);
    }
  }, [activeWorkspace]);

  return null;
}
