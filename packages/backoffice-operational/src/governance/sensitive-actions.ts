import { getBackofficeStore } from "../store/backoffice-store.js";
import { immutableBackofficeAuditTrail } from "../audit/immutable-audit-trail.js";
import { getBackofficeEnterpriseGovernanceRepository } from "../repositories/backoffice-enterprise-governance.repository.js";

export type SensitiveAction =
  | "user_suspend"
  | "user_reactivate"
  | "user_archive"
  | "enterprise_suspend"
  | "enterprise_reactivate"
  | "enterprise_archive";

export async function applySensitiveUserAction(
  userId: string,
  action: SensitiveAction,
  actor: { email: string; id: string },
  note: string,
): Promise<{ ok: true } | { ok: false; code: string }> {
  if (!note.trim()) return { ok: false, code: "note_required" };
  const store = getBackofficeStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return { ok: false, code: "not_found" };

  const prev = user.securityStatus;
  if (action === "user_suspend") user.securityStatus = "suspended";
  if (action === "user_reactivate") user.securityStatus = "ok";
  if (action === "user_archive") user.securityStatus = "archived";

  await immutableBackofficeAuditTrail({
    actorEmail: actor.email,
    actorId: actor.id,
    action,
    targetType: "user",
    targetId: userId,
    note: note.trim(),
    metadata: { previousState: prev, newState: user.securityStatus, archived: action === "user_archive" },
  });
  return { ok: true };
}

export async function applySensitiveEnterpriseAction(
  enterpriseId: string,
  action: SensitiveAction,
  actor: { email: string; id: string },
  note: string,
): Promise<{ ok: true } | { ok: false; code: string }> {
  if (!note.trim()) return { ok: false, code: "note_required" };
  const repo = getBackofficeEnterpriseGovernanceRepository();
  const ent = await repo.getEnterprise(enterpriseId);
  if (!ent) return { ok: false, code: "not_found" };

  const prev = ent.channelStatus;
  if (action === "enterprise_suspend") ent.channelStatus = "suspended";
  if (action === "enterprise_reactivate") ent.channelStatus = "open";
  if (action === "enterprise_archive") ent.channelStatus = "archived";

  await repo.upsertEnterpriseProfile(ent);
  await repo.appendGovernanceEvent({
    enterpriseId,
    eventKind: action,
    title: action,
    detail: note.trim(),
    author: actor.email,
    previousState: prev,
    newState: ent.channelStatus,
  });

  await immutableBackofficeAuditTrail({
    actorEmail: actor.email,
    actorId: actor.id,
    action,
    targetType: "enterprise",
    targetId: enterpriseId,
    note: note.trim(),
    metadata: { previousState: prev, newState: ent.channelStatus, archivedReason: note },
  });
  return { ok: true };
}
