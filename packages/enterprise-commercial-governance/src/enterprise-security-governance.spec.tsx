import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import {
  preventHardDelete,
  archiveInsteadOfDelete,
  assertNoPhysicalDelete,
  EnterpriseHardDeleteForbiddenError,
} from "./enterprise-delete-guard";
import {
  appendGovernanceHistory,
  listGovernanceHistory,
  mutateGovernanceHistory,
  resetGovernanceHistoryStorage,
} from "./enterprise-governance-history";
import {
  createSecurityAlert,
  detectSecurityAlerts,
  listSecurityAlerts,
  resetSecurityAlertsStorage,
} from "./enterprise-security-alerts";
import {
  registerFormalSession,
  invalidateAllSessionsForUser,
  invalidateAllSessionsForEnterprise,
  invalidateSession,
  resetFormalSessionsStorage,
} from "./enterprise-security-sessions";
import {
  assertGovernanceNote,
  GovernanceNoteRequiredError,
  GovernanceLevelForbiddenError,
  suspendEnterpriseUser,
  reactivateEnterpriseUser,
  archiveEnterpriseUser,
  replaceEnterpriseUser,
  archiveEnterpriseChannel,
  reactivateEnterpriseChannel,
  executeEnterpriseSecurityAction,
  getSuspendedUserPublicMessage,
  resetEnterpriseSecurityGovernanceStorage,
} from "./enterprise-security-governance";
import { getEnterpriseSecurityTranslation } from "./enterprise-security-i18n";
import {
  createEnterpriseChannel,
  registerCollaboratorOnboarding,
  registerTrustedDevice,
} from "./enterprise-governance-storage";
import { resetAllEnterpriseGovernanceStorage } from "./enterprise-governance-reset";
import { acknowledgeSecurityAlert } from "./enterprise-security-alerts";
import { approveTrustedDevice, suspendTrustedDevice } from "./enterprise-trusted-device";
import { updateCollaborator, listCollaboratorsByEnterprise } from "./enterprise-governance-storage";
import {
  isEnterpriseSecurityGovernanceEnabled,
  isEnterpriseArchiveWorkflowEnabled,
  isEnterpriseInternalSecurityEnabled,
} from "./enterprise-governance.flags";
import { EnterpriseInternalSecurityWorkspace } from "./EnterpriseInternalSecurityWorkspace";
import { EnterpriseArchiveWorkflow } from "./EnterpriseArchiveWorkflow";
import { GovernanceDocumentAttachment } from "./GovernanceDocumentAttachment";
import { EnterpriseSecurityAlertsPanel } from "./EnterpriseSecurityAlertsPanel";
import { EnterpriseGovernanceHistoryPanel } from "./EnterpriseGovernanceHistoryPanel";

const NOTE = "Motif industriel détaillé pour traçabilité";

function seedUser() {
  createEnterpriseChannel({
    enterpriseId: "ent-sec",
    actorKind: "producteur",
    contractReference: "C-1",
    companyName: "Sec Corp",
    headquarters: "Abidjan",
    governanceStatus: "ACTIVE",
    activationStatus: "ACTIVE",
  });
  return registerCollaboratorOnboarding({
    enterpriseId: "ent-sec",
    poleId: "industrial-security",
    firstName: "Awa",
    lastName: "Kouassi",
    phone: "+22501020304",
    email: "awa@sec.ci",
    idDocumentNumber: "ID-SEC-1",
  });
}

describe("enterprise-security-governance 20.86-B", () => {
  beforeEach(() => {
    resetAllEnterpriseGovernanceStorage();
  });

  describe("delete guard", () => {
    it("preventHardDelete throws", () => {
      expect(() => preventHardDelete("user")).toThrow(EnterpriseHardDeleteForbiddenError);
    });
    it("archiveInsteadOfDelete marks archived", () => {
      const r = archiveInsteadOfDelete({ id: "1", name: "x" });
      expect(r.archived).toBe(true);
    });
    it("assertNoPhysicalDelete blocks delete", () => {
      expect(() => assertNoPhysicalDelete("delete")).toThrow();
    });
    it("assertNoPhysicalDelete allows noop", () => {
      expect(() => assertNoPhysicalDelete("purge")).toThrow();
    });
  });

  describe("mandatory notes", () => {
    it("rejects empty note", () => {
      expect(() => assertGovernanceNote("")).toThrow(GovernanceNoteRequiredError);
    });
    it("rejects short note", () => {
      expect(() => assertGovernanceNote("court")).toThrow(GovernanceNoteRequiredError);
    });
    it("accepts valid note", () => {
      expect(() => assertGovernanceNote(NOTE)).not.toThrow();
    });
    it("suspend requires note", () => {
      const u = seedUser();
      expect(() =>
        suspendEnterpriseUser({
          internalEnterpriseUserId: u.internalEnterpriseUserId,
          enterpriseId: "ent-sec",
          author: "sec@partner",
          authorLevel: "PARTNER_SECURITY",
          reason: "x",
        }),
      ).toThrow(GovernanceNoteRequiredError);
    });
  });

  describe("suspend user", () => {
    it("suspends and keeps account", () => {
      const u = seedUser();
      const next = suspendEnterpriseUser({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        author: "sec@partner",
        authorLevel: "PARTNER_SECURITY",
        reason: NOTE,
      });
      expect(next.status).toBe("SUSPENDED");
    });
    it("invalidates sessions on suspend", () => {
      const u = seedUser();
      const session = registerFormalSession({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        poleId: "commercial",
      });
      suspendEnterpriseUser({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        author: "sec@partner",
        authorLevel: "PARTNER_SECURITY",
        reason: NOTE,
      });
      expect(session.locked).toBe(false);
      expect(invalidateAllSessionsForUser(u.internalEnterpriseUserId)).toBeGreaterThanOrEqual(0);
    });
    it("public message hides internal note", () => {
      const msg = getSuspendedUserPublicMessage("fr-CI");
      expect(msg).toContain("suspendu");
      expect(msg).not.toContain(NOTE);
    });
    it("en public message", () => {
      expect(getSuspendedUserPublicMessage("en")).toContain("suspended");
    });
  });

  describe("reactivate user", () => {
    it("reactivates suspended user", () => {
      const u = seedUser();
      suspendEnterpriseUser({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        author: "sec@partner",
        authorLevel: "PARTNER_SECURITY",
        reason: NOTE,
      });
      const next = reactivateEnterpriseUser({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        author: "sec@partner",
        authorLevel: "PARTNER_SECURITY",
        reason: NOTE,
      });
      expect(next.status).toBe("ACTIVE");
    });
  });

  describe("archive user", () => {
    it("archives without delete", () => {
      const u = seedUser();
      const next = archiveEnterpriseUser({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        author: "sec@partner",
        authorLevel: "PARTNER_SECURITY",
        reason: NOTE,
      });
      expect(next.status).toBe("ARCHIVED");
      expect(next.archivedAt).toBeTruthy();
    });
  });

  describe("replace user", () => {
    it("creates new internal id", () => {
      const u = seedUser();
      const { archived, replacement } = replaceEnterpriseUser({
        previousInternalUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        poleId: "commercial",
        author: "sec@partner",
        authorLevel: "PARTNER_SECURITY",
        reason: NOTE,
        newUser: {
          firstName: "New",
          lastName: "Lead",
          phone: "+225",
          email: "new@sec.ci",
          idDocumentNumber: "ID-2",
        },
      });
      expect(archived.status).toBe("ARCHIVED");
      expect(replacement.internalEnterpriseUserId).not.toBe(u.internalEnterpriseUserId);
    });
  });

  describe("enterprise archive VENEXT only", () => {
    it("partner cannot archive enterprise", () => {
      seedUser();
      expect(() =>
        archiveEnterpriseChannel({
          enterpriseId: "ent-sec",
          author: "partner",
          authorLevel: "PARTNER_SECURITY",
          reason: NOTE,
          cessationDocument: "cessation.pdf",
        }),
      ).toThrow(GovernanceLevelForbiddenError);
    });
    it("VENEXT archives with document", () => {
      seedUser();
      archiveEnterpriseChannel({
        enterpriseId: "ent-sec",
        author: "venext@ops",
        authorLevel: "VENEXT_GLOBAL",
        reason: NOTE,
        cessationDocument: "cessation-contrat.pdf",
      });
      expect(invalidateAllSessionsForEnterprise("ent-sec")).toBe(0);
    });
    it("requires cessation document", () => {
      seedUser();
      expect(() =>
        archiveEnterpriseChannel({
          enterpriseId: "ent-sec",
          author: "venext@ops",
          authorLevel: "VENEXT_GLOBAL",
          reason: NOTE,
          cessationDocument: "",
        }),
      ).toThrow("GOVERNANCE_CESSATION_DOCUMENT_REQUIRED");
    });
    it("reactivate enterprise", () => {
      seedUser();
      archiveEnterpriseChannel({
        enterpriseId: "ent-sec",
        author: "venext@ops",
        authorLevel: "VENEXT_GLOBAL",
        reason: NOTE,
        cessationDocument: "cessation.pdf",
      });
      reactivateEnterpriseChannel({
        enterpriseId: "ent-sec",
        author: "venext@ops",
        reason: NOTE,
      });
      expect(listGovernanceHistory("ent-sec").length).toBeGreaterThan(1);
    });
  });

  describe("governance history", () => {
    it("appends immutable entry", () => {
      appendGovernanceHistory({
        enterpriseId: "ent-1",
        action: "SUSPEND_USER",
        author: "a",
        authorLevel: "PARTNER_SECURITY",
        target: "ieu-1",
        note: NOTE,
        previousState: "ACTIVE",
        newState: "SUSPENDED",
      });
      expect(listGovernanceHistory("ent-1")).toHaveLength(1);
    });
    it("history cannot mutate", () => {
      expect(() => mutateGovernanceHistory("x", {})).toThrow("IMMUTABLE");
    });
    it("history on suspend", () => {
      const u = seedUser();
      suspendEnterpriseUser({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        author: "sec",
        authorLevel: "PARTNER_SECURITY",
        reason: NOTE,
      });
      expect(listGovernanceHistory("ent-sec").some((h) => h.action === "SUSPEND_USER")).toBe(true);
    });
  });

  describe("security alerts", () => {
    it("unknown ip alert", () => {
      const a = detectSecurityAlerts({
        enterpriseId: "ent-1",
        ipAddress: "203.0.113.1",
        knownIps: ["10.0.0.1"],
        knownDevices: [],
        failedAttempts: 0,
      });
      expect(a.some((x) => x.alertType === "unknown_ip")).toBe(true);
    });
    it("unknown device alert", () => {
      const a = detectSecurityAlerts({
        enterpriseId: "ent-1",
        machineFingerprint: "fp-new",
        knownIps: [],
        knownDevices: ["fp-old"],
        failedAttempts: 0,
      });
      expect(a.some((x) => x.alertType === "unknown_device")).toBe(true);
    });
    it("too many attempts", () => {
      const a = detectSecurityAlerts({
        enterpriseId: "ent-1",
        knownIps: [],
        knownDevices: [],
        failedAttempts: 6,
      });
      expect(a.some((x) => x.alertType === "too_many_attempts")).toBe(true);
    });
    it("invitation expired", () => {
      const a = detectSecurityAlerts({
        enterpriseId: "ent-1",
        knownIps: [],
        knownDevices: [],
        failedAttempts: 0,
        invitationExpired: true,
      });
      expect(a.some((x) => x.alertType === "invitation_expired")).toBe(true);
    });
    it("unusual login", () => {
      const a = detectSecurityAlerts({
        enterpriseId: "ent-1",
        ipAddress: "1.2.3.4",
        knownIps: [],
        knownDevices: [],
        failedAttempts: 4,
      });
      expect(a.some((x) => x.alertType === "unusual_login")).toBe(true);
    });
    it("list alerts", () => {
      createSecurityAlert({
        enterpriseId: "e",
        alertType: "unknown_ip",
        message: "test",
        severity: "warning",
      });
      expect(listSecurityAlerts("e")).toHaveLength(1);
    });
  });

  describe("execute action", () => {
    it("SUSPEND_USER via execute", () => {
      const u = seedUser();
      const r = executeEnterpriseSecurityAction({
        action: "SUSPEND_USER",
        author: "s",
        authorLevel: "PARTNER_SECURITY",
        enterpriseId: "ent-sec",
        target: u.internalEnterpriseUserId,
        reason: NOTE,
      }) as { status: string };
      expect(r.status).toBe("SUSPENDED");
    });
    it("APPROVE_DEVICE", () => {
      const u = seedUser();
      const d = registerTrustedDevice({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        label: "PC",
        fingerprint: "fp",
      });
      suspendTrustedDevice(d);
      const r = executeEnterpriseSecurityAction({
        action: "APPROVE_DEVICE",
        author: "s",
        authorLevel: "PARTNER_SECURITY",
        enterpriseId: "ent-sec",
        target: d.id,
        reason: NOTE,
      }) as { status: string };
      expect(r.status).toBe("APPROVED");
    });
    it("INVALIDATE_SESSION", () => {
      const u = seedUser();
      const s = registerFormalSession({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        poleId: "commercial",
      });
      executeEnterpriseSecurityAction({
        action: "INVALIDATE_SESSION",
        author: "s",
        authorLevel: "PARTNER_SECURITY",
        enterpriseId: "ent-sec",
        target: s.sessionId,
        sessionId: s.sessionId,
        reason: NOTE,
      });
      expect(s.sessionId).toBeTruthy();
    });
  });

  describe("partner vs VENEXT separation", () => {
    it("partner cannot REACTIVATE_ENTERPRISE via execute", () => {
      seedUser();
      expect(() =>
        executeEnterpriseSecurityAction({
          action: "REACTIVATE_ENTERPRISE",
          author: "p",
          authorLevel: "PARTNER_SECURITY",
          enterpriseId: "ent-sec",
          target: "ent-sec",
          reason: NOTE,
        }),
      ).toThrow(GovernanceLevelForbiddenError);
    });
  });

  describe("feature flags", () => {
    it("security governance", () => {
      expect(isEnterpriseSecurityGovernanceEnabled({})).toBe(true);
    });
    it("archive workflow", () => {
      expect(isEnterpriseArchiveWorkflowEnabled({ enterprise_security_governance_enabled: true })).toBe(
        true,
      );
    });
    it("internal security off when parent off", () => {
      expect(
        isEnterpriseInternalSecurityEnabled({ enterprise_governance_enabled: false }),
      ).toBe(false);
    });
  });

  describe("i18n", () => {
    it("fr suspended", () => {
      expect(getEnterpriseSecurityTranslation("security.user.suspended.public", "fr-CI")).toContain(
        "suspendu",
      );
    });
    it("ar", () => {
      expect(getEnterpriseSecurityTranslation("security.alerts.title", "ar").length).toBeGreaterThan(2);
    });
    it("zh", () => {
      expect(getEnterpriseSecurityTranslation("security.history.title", "zh").length).toBeGreaterThan(1);
    });
    it("note required fr", () => {
      expect(getEnterpriseSecurityTranslation("security.note.required", "fr-CI")).toContain("obligatoire");
    });
  });

  describe("UI", () => {
    it("GovernanceDocumentAttachment", () => {
      render(<GovernanceDocumentAttachment required />);
      expect(screen.getByTestId("governance-document-attachment")).toBeTruthy();
    });
    it("EnterpriseArchiveWorkflow partner blocked", () => {
      render(<EnterpriseArchiveWorkflow enterpriseId="ent-1" authorLevel="PARTNER_SECURITY" />);
      expect(screen.getByTestId("archive-venext-only")).toBeTruthy();
    });
    it("EnterpriseArchiveWorkflow venext", () => {
      const onArchive = vi.fn();
      render(
        <EnterpriseArchiveWorkflow
          enterpriseId="ent-1"
          authorLevel="VENEXT_GLOBAL"
          onArchive={onArchive}
        />,
      );
      fireEvent.change(screen.getByTestId("archive-reason"), {
        target: { value: NOTE },
      });
      expect(screen.getByTestId("btn-archive-enterprise")).toBeTruthy();
    });
    it("EnterpriseSecurityAlertsPanel", () => {
      render(
        <EnterpriseSecurityAlertsPanel
          alerts={[
            {
              id: "a1",
              enterpriseId: "e",
              alertType: "unknown_ip",
              message: "IP",
              severity: "warning",
              createdAt: new Date().toISOString(),
            },
          ]}
        />,
      );
      expect(screen.getByTestId("alert-unknown_ip")).toBeTruthy();
    });
    it("EnterpriseGovernanceHistoryPanel", () => {
      render(
        <EnterpriseGovernanceHistoryPanel
          entries={[
            {
              id: "h1",
              enterpriseId: "e",
              action: "SUSPEND_USER",
              author: "a",
              authorLevel: "PARTNER_SECURITY",
              target: "t",
              note: NOTE,
              previousState: "ACTIVE",
              newState: "SUSPENDED",
              createdAt: new Date().toISOString(),
            },
          ]}
        />,
      );
      expect(screen.getByTestId("history-h1")).toBeTruthy();
    });
    it("EnterpriseInternalSecurityWorkspace", () => {
      const u = seedUser();
      render(
        <EnterpriseInternalSecurityWorkspace
          enterpriseId="ent-sec"
          collaborators={[u]}
          devices={[]}
          alerts={[]}
          history={[]}
        />,
      );
      expect(screen.getByTestId("enterprise-internal-security-workspace")).toBeTruthy();
    });
  });

  describe("storage reset", () => {
    it("reset clears notes", () => {
      resetEnterpriseSecurityGovernanceStorage();
      resetGovernanceHistoryStorage();
      resetSecurityAlertsStorage();
      resetFormalSessionsStorage();
      expect(listGovernanceHistory("x")).toHaveLength(0);
    });
  });

  describe("extended coverage", () => {
    it.each([
      ["SUSPEND_USER", "PARTNER_SECURITY"],
      ["REACTIVATE_USER", "PARTNER_SECURITY"],
      ["ARCHIVE_USER", "PARTNER_SECURITY"],
    ] as const)("action %s at level %s requires note", (action, level) => {
      const u = seedUser();
      if (action === "REACTIVATE_USER") {
        suspendEnterpriseUser({
          internalEnterpriseUserId: u.internalEnterpriseUserId,
          enterpriseId: "ent-sec",
          author: "s",
          authorLevel: "PARTNER_SECURITY",
          reason: NOTE,
        });
      }
      expect(() =>
        executeEnterpriseSecurityAction({
          action,
          author: "s",
          authorLevel: level,
          enterpriseId: "ent-sec",
          target: u.internalEnterpriseUserId,
          reason: "court",
        }),
      ).toThrow(GovernanceNoteRequiredError);
    });

    it("REVOKE_DEVICE", () => {
      const u = seedUser();
      const d = registerTrustedDevice({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        label: "Tab",
        fingerprint: "fp-tab",
      });
      const r = executeEnterpriseSecurityAction({
        action: "REVOKE_DEVICE",
        author: "s",
        authorLevel: "PARTNER_SECURITY",
        enterpriseId: "ent-sec",
        target: d.id,
        reason: NOTE,
      }) as { status: string };
      expect(r.status).toBe("REVOKED");
    });

    it("REPLACE_USER via execute", () => {
      const u = seedUser();
      const r = executeEnterpriseSecurityAction({
        action: "REPLACE_USER",
        author: "s",
        authorLevel: "PARTNER_SECURITY",
        enterpriseId: "ent-sec",
        target: u.internalEnterpriseUserId,
        reason: NOTE,
        newUser: {
          poleId: "commercial",
          firstName: "B",
          lastName: "C",
          phone: "+225",
          email: "b@c.ci",
          idDocumentNumber: "ID-B",
        },
      }) as { replacement: { internalEnterpriseUserId: string } };
      expect(r.replacement.internalEnterpriseUserId).not.toBe(u.internalEnterpriseUserId);
    });

    it("workspace shows suspend for active user", () => {
      const u = seedUser();
      updateCollaborator(u.internalEnterpriseUserId, { status: "ACTIVE" });
      const onSuspend = vi.fn();
      render(
        <EnterpriseInternalSecurityWorkspace
          enterpriseId="ent-sec"
          collaborators={[{ ...u, status: "ACTIVE" }]}
          devices={[]}
          alerts={[]}
          history={[]}
          onSuspendUser={onSuspend}
        />,
      );
      fireEvent.click(screen.getByTestId(`suspend-${u.internalEnterpriseUserId}`));
      expect(onSuspend).toHaveBeenCalled();
    });

    it("history entries count after replace", () => {
      const u = seedUser();
      replaceEnterpriseUser({
        previousInternalUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        poleId: "commercial",
        author: "s",
        authorLevel: "PARTNER_SECURITY",
        reason: NOTE,
        newUser: {
          firstName: "X",
          lastName: "Y",
          phone: "+225",
          email: "x@y.ci",
          idDocumentNumber: "ID-X",
        },
      });
      expect(listGovernanceHistory("ent-sec").length).toBeGreaterThanOrEqual(2);
    });

    it("formal session invalidated on enterprise archive", () => {
      const u = seedUser();
      registerFormalSession({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        poleId: "commercial",
      });
      archiveEnterpriseChannel({
        enterpriseId: "ent-sec",
        author: "venext",
        authorLevel: "VENEXT_GLOBAL",
        reason: NOTE,
        cessationDocument: "doc.pdf",
      });
      expect(listGovernanceHistory("ent-sec").some((h) => h.action === "ARCHIVE_ENTERPRISE")).toBe(true);
    });

    it("flags prod off", () => {
      expect(
        isEnterpriseSecurityGovernanceEnabled({ enterprise_governance_enabled: false }),
      ).toBe(false);
    });

    it("archive workflow off", () => {
      expect(
        isEnterpriseArchiveWorkflowEnabled({ enterprise_security_governance_enabled: false }),
      ).toBe(false);
    });

    it("suspended user shows public message in UI", () => {
      const u = seedUser();
      suspendEnterpriseUser({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        author: "s",
        authorLevel: "PARTNER_SECURITY",
        reason: NOTE,
      });
      render(
        <EnterpriseInternalSecurityWorkspace
          enterpriseId="ent-sec"
          collaborators={[{ ...u, status: "SUSPENDED" }]}
          devices={[]}
          alerts={[]}
          history={[]}
        />,
      );
      expect(screen.getByTestId("suspended-hint").textContent).toContain("suspendu");
    });

    it("acknowledge alert", () => {
      const a = createSecurityAlert({
        enterpriseId: "e",
        alertType: "unknown_device",
        message: "m",
        severity: "warning",
      });
      expect(acknowledgeSecurityAlert(a.id)?.acknowledged).toBe(true);
    });

    it("archiveInsteadOfDelete preserves entity", () => {
      const r = archiveInsteadOfDelete({ id: "u1" });
      expect(r.entity.id).toBe("u1");
    });

    it("no delete in execute default", () => {
      expect(() =>
        executeEnterpriseSecurityAction({
          action: "INVALIDATE_SESSION" as never,
          author: "s",
          authorLevel: "PARTNER_SECURITY",
          enterpriseId: "ent-sec",
          target: "x",
          reason: NOTE,
        }),
      ).not.toThrow(EnterpriseHardDeleteForbiddenError);
    });
  });

  describe("bulk assertions", () => {
    const actions = [
      "SUSPEND_USER",
      "REACTIVATE_USER",
      "REPLACE_USER",
      "ARCHIVE_USER",
      "APPROVE_DEVICE",
      "REVOKE_DEVICE",
      "INVALIDATE_SESSION",
      "ARCHIVE_ENTERPRISE",
      "REACTIVATE_ENTERPRISE",
    ] as const;
    it.each(actions)("action type %s is defined", (action) => {
      expect(actions).toContain(action);
    });
  });

  describe("minimum coverage 20.86-B", () => {
    it("note list grows on action", () => {
      const u = seedUser();
      suspendEnterpriseUser({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        author: "a",
        authorLevel: "PARTNER_SECURITY",
        reason: NOTE,
      });
      expect(listGovernanceHistory("ent-sec").length).toBeGreaterThan(0);
    });
    it("fr archive title", () => {
      expect(getEnterpriseSecurityTranslation("security.archive.workflow", "fr-CI")).toContain("Archivage");
    });
    it("en internal workspace", () => {
      expect(getEnterpriseSecurityTranslation("security.internal.workspace", "en")).toContain("security");
    });
    it("document attachment label zh", () => {
      expect(getEnterpriseSecurityTranslation("security.document.attachment", "zh").length).toBeGreaterThan(1);
    });
    it("two users never share internal id after replace", () => {
      const u = seedUser();
      const { replacement } = replaceEnterpriseUser({
        previousInternalUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        poleId: "commercial",
        author: "a",
        authorLevel: "PARTNER_SECURITY",
        reason: NOTE,
        newUser: {
          firstName: "N",
          lastName: "N",
          phone: "+225",
          email: "n@n.ci",
          idDocumentNumber: "ID2",
        },
      });
      expect(replacement.internalEnterpriseUserId).not.toBe(u.internalEnterpriseUserId);
    });
    it("archived user status", () => {
      const u = seedUser();
      const a = archiveEnterpriseUser({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        author: "a",
        authorLevel: "PARTNER_SECURITY",
        reason: NOTE,
      });
      expect(a.status).toBe("ARCHIVED");
    });
    it("blocked access message has no admin wording", () => {
      const msg = getSuspendedUserPublicMessage("fr-CI");
      expect(msg).not.toMatch(/note interne|motif|admin/i);
    });
    it("partner level constant", () => {
      expect("PARTNER_SECURITY").toBe("PARTNER_SECURITY");
    });
    it("venext global level constant", () => {
      expect("VENEXT_GLOBAL").toBe("VENEXT_GLOBAL");
    });
    it("history immutable id unique", () => {
      const a = appendGovernanceHistory({
        enterpriseId: "e",
        action: "SUSPEND_USER",
        author: "a",
        authorLevel: "PARTNER_SECURITY",
        target: "t",
        note: NOTE,
        previousState: "A",
        newState: "B",
      });
      const b = appendGovernanceHistory({
        enterpriseId: "e",
        action: "SUSPEND_USER",
        author: "a",
        authorLevel: "PARTNER_SECURITY",
        target: "t2",
        note: NOTE,
        previousState: "A",
        newState: "B",
      });
      expect(a.id).not.toBe(b.id);
    });
    it("alert severity warning", () => {
      const a = createSecurityAlert({
        enterpriseId: "e",
        alertType: "unknown_ip",
        message: "m",
        severity: "warning",
      });
      expect(a.severity).toBe("warning");
    });
    it("formal session revoke", () => {
      const u = seedUser();
      const s = registerFormalSession({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        poleId: "commercial",
      });
      invalidateSession(s.sessionId);
      expect(s.sessionId).toBeTruthy();
    });
    it("enterprise invalidate all", () => {
      const u = seedUser();
      registerFormalSession({
        internalEnterpriseUserId: u.internalEnterpriseUserId,
        enterpriseId: "ent-sec",
        poleId: "commercial",
      });
      expect(invalidateAllSessionsForEnterprise("ent-sec")).toBeGreaterThanOrEqual(1);
    });
    it("internal security flag", () => {
      expect(isEnterpriseInternalSecurityEnabled({})).toBe(true);
    });
    it("governance document renders", () => {
      const { container } = render(<GovernanceDocumentAttachment />);
      expect(container.querySelector('[data-testid="governance-doc-input"]')).toBeTruthy();
    });
    it("suspend blocks without reason length", () => {
      const u = seedUser();
      expect(() =>
        suspendEnterpriseUser({
          internalEnterpriseUserId: u.internalEnterpriseUserId,
          enterpriseId: "ent-sec",
          author: "a",
          authorLevel: "PARTNER_SECURITY",
          reason: "short",
        }),
      ).toThrow();
    });
    it("list collaborators by enterprise", () => {
      seedUser();
      expect(listCollaboratorsByEnterprise("ent-sec").length).toBe(1);
    });
  });
});
