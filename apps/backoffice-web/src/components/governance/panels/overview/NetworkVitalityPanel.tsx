"use client";

import { OperationalStrip } from "../../ui/OperationalStrip";
import { vx } from "../../ui/vx-styles";

type Props = {
  activeOrganizations?: unknown;
  governanceSuspendedOrgs?: unknown;
  relationshipExpansion?: Record<string, number>;
};

export function NetworkVitalityPanel({ activeOrganizations, governanceSuspendedOrgs, relationshipExpansion }: Props) {
  const rel = relationshipExpansion;
  return (
    <section className="rounded-lg border border-white/10 p-3" style={{ backgroundColor: "rgba(0,168,132,0.08)" }}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: vx.mint }}>
        Network vitality
      </p>
      <OperationalStrip label="Active organizations">
        {String(activeOrganizations ?? "—")} live · {String(governanceSuspendedOrgs ?? "—")} governance-suspended
      </OperationalStrip>
      <div className="mt-2 text-[11px] text-white/75">
        Relationships — accepted {rel?.accepted ?? "—"}, pending {rel?.pending ?? "—"}, blocked {rel?.blocked ?? "—"}, suspended{" "}
        {rel?.suspended ?? "—"}
      </div>
    </section>
  );
}
