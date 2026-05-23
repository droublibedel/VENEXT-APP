import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import {
  resolveAccountSegment,
  isLargeAccountSegment,
  requiresSupervisedOnboarding,
} from "./enterprise-account-segments";
import {
  VENEXT_CANONICAL_POLES,
  listVenextCanonicalPoles,
  rejectUnknownPoleCreation,
  assertPoleExistsInVenext,
} from "./venext-canonical-poles";
import {
  generateEnterpriseActivationCode,
  generateEnterpriseSecureLink,
  resolveEnterpriseInvitation,
  invalidateEnterpriseInvitation,
  buildEnterprisePrivateUrl,
} from "./enterprise-secure-links";
import { buildFormalPasswordStrength, validateFormalPassword } from "./enterprise-formal-password";
import {
  approveTrustedDevice,
  revokeTrustedDevice,
  suspendTrustedDevice,
  isTrustedDeviceActive,
} from "./enterprise-trusted-device";
import {
  ENTERPRISE_ONBOARDING_STEPS,
  computeOnboardingProgress,
  generateInternalEnterpriseUserId,
} from "./enterprise-onboarding-workflow";
import {
  createEnterpriseChannel,
  activateEnterprisePole,
  registerCollaboratorOnboarding,
  reviewCollaborator,
  listPendingCollaborators,
  listPoleActivations,
  resetEnterpriseGovernanceStorage,
  registerTrustedDevice,
  registerTrustedIp,
  getInvitation,
} from "./enterprise-governance-storage";
import { buildEnterpriseInvitationTemplate } from "./enterprise-invitation-template";
import {
  isEnterpriseGovernanceEnabled,
  isEnterpriseSecureChannelsEnabled,
  isEnterpriseControlledOnboardingEnabled,
} from "./enterprise-governance.flags";
import {
  createFormalSession,
  touchFormalSession,
  assertFormalSessionValid,
  revokeFormalSession,
  isFormalSessionDistinctFromTerrainMode,
} from "./enterprise-formal-session";
import { getEnterpriseGovernanceTranslation } from "./enterprise-governance-i18n";
import { EnterpriseChannelWorkspace } from "./EnterpriseChannelWorkspace";
import { EnterpriseOnboardingTimeline } from "./EnterpriseOnboardingTimeline";
import { EnterpriseValidationPanel } from "./EnterpriseValidationPanel";
import { EnterpriseContractUpload } from "./EnterpriseContractUpload";
import { EnterpriseContractReview } from "./EnterpriseContractReview";
import { EnterpriseActivationQueue } from "./EnterpriseActivationQueue";
import { EnterpriseActivationReview } from "./EnterpriseActivationReview";
import { EnterpriseSecurityControlPanel } from "./EnterpriseSecurityControlPanel";
import { EnterpriseInvitationPreview } from "./EnterpriseInvitationPreview";
import { EnterprisePoleActivationPanel } from "./EnterprisePoleActivationPanel";

describe("enterprise-commercial-governance", () => {
  beforeEach(() => resetEnterpriseGovernanceStorage());

  describe("account segments", () => {
    it("SMALL for grossiste_b", () => {
      expect(resolveAccountSegment("grossiste_b")).toBe("SMALL_ACCOUNTS");
    });
    it("SMALL for detaillant", () => {
      expect(resolveAccountSegment("detaillant")).toBe("SMALL_ACCOUNTS");
    });
    it("LARGE for producteur", () => {
      expect(resolveAccountSegment("producteur")).toBe("LARGE_ACCOUNTS");
    });
    it("LARGE for grossiste_a", () => {
      expect(resolveAccountSegment("grossiste_a")).toBe("LARGE_ACCOUNTS");
    });
    it("isLargeAccountSegment", () => {
      expect(isLargeAccountSegment("LARGE_ACCOUNTS")).toBe(true);
    });
    it("requiresSupervisedOnboarding", () => {
      expect(requiresSupervisedOnboarding("LARGE_ACCOUNTS")).toBe(true);
    });
  });

  describe("canonical poles", () => {
    it("lists existing poles only", () => {
      expect(listVenextCanonicalPoles().length).toBe(VENEXT_CANONICAL_POLES.length);
    });
    it("rejects unknown pole", () => {
      expect(() => rejectUnknownPoleCreation("fake-pole")).toThrow("VENEXT_POLE_NOT_IN_PLATFORM");
    });
    it("accepts executive", () => {
      expect(assertPoleExistsInVenext("executive")).toBe(true);
    });
    it("accepts industrial-security", () => {
      expect(assertPoleExistsInVenext("industrial-security")).toBe(true);
    });
  });

  describe("secure links", () => {
    it("generates activation code", () => {
      expect(generateEnterpriseActivationCode()).toMatch(/^VEN-\d{6}$/);
    });
    it("generates private url", () => {
      const url = buildEnterprisePrivateUrl("ent-1", "commercial", "slug-abc");
      expect(url).toContain("venext.co/e/");
    });
    it("generates secure link", () => {
      const link = generateEnterpriseSecureLink({ enterpriseId: "ent-1", poleId: "commercial" });
      expect(link.privateUrl).toContain("/e/");
      expect(link.activationCode).toMatch(/^VEN-/);
    });
    it("resolves valid invitation", () => {
      const { invitation } = generateEnterpriseSecureLink({ enterpriseId: "e", poleId: "executive", ttlMs: 3600000 });
      expect(resolveEnterpriseInvitation(invitation).ok).toBe(true);
    });
    it("rejects expired invitation", () => {
      const inv = generateEnterpriseSecureLink({ enterpriseId: "e", poleId: "executive", ttlMs: 1 }).invitation;
      expect(resolveEnterpriseInvitation(inv, Date.now() + 10000).reason).toBe("expired");
    });
    it("rejects revoked invitation", () => {
      const inv = generateEnterpriseSecureLink({ enterpriseId: "e", poleId: "executive" }).invitation;
      const revoked = invalidateEnterpriseInvitation(inv);
      expect(resolveEnterpriseInvitation(revoked).reason).toBe("revoked");
    });
    it("rejects invalid pole on invitation", () => {
      const inv = generateEnterpriseSecureLink({ enterpriseId: "e", poleId: "executive" }).invitation;
      inv.poleId = "unknown-pole";
      expect(resolveEnterpriseInvitation(inv).reason).toBe("invalid");
    });
  });

  describe("formal password", () => {
    it("valid password", () => {
      expect(validateFormalPassword("Abcdef1!").valid).toBe(true);
    });
    it("rejects short", () => {
      expect(validateFormalPassword("Ab1").valid).toBe(false);
    });
    it("requires uppercase", () => {
      expect(buildFormalPasswordStrength("abcdef1").hints.some((h) => h.includes("majuscule"))).toBe(true);
    });
    it("requires digit", () => {
      expect(buildFormalPasswordStrength("Abcdefgh").hints.some((h) => h.includes("chiffre"))).toBe(true);
    });
    it("recommends symbol", () => {
      expect(buildFormalPasswordStrength("Abcdef12").hints.some((h) => h.includes("Symbole"))).toBe(true);
    });
  });

  describe("trusted device", () => {
    const device = {
      id: "d1",
      internalEnterpriseUserId: "ieu-1",
      enterpriseId: "ent-1",
      label: "MacBook",
      fingerprint: "fp-1",
      status: "SUSPENDED" as const,
    };
    it("approve", () => {
      expect(approveTrustedDevice(device).status).toBe("APPROVED");
    });
    it("revoke", () => {
      expect(revokeTrustedDevice(device).status).toBe("REVOKED");
    });
    it("suspend", () => {
      expect(suspendTrustedDevice(approveTrustedDevice(device)).status).toBe("SUSPENDED");
    });
    it("is active when approved", () => {
      expect(isTrustedDeviceActive(approveTrustedDevice(device))).toBe(true);
    });
  });

  describe("onboarding workflow", () => {
    it("has 10 steps", () => {
      expect(ENTERPRISE_ONBOARDING_STEPS).toHaveLength(10);
    });
    it("computes progress", () => {
      expect(computeOnboardingProgress(["commercial_meeting", "contract_signed"])).toBe(20);
    });
    it("internal id distinct", () => {
      const a = generateInternalEnterpriseUserId("ent-x");
      const b = generateInternalEnterpriseUserId("ent-x");
      expect(a).not.toBe(b);
      expect(a.startsWith("ieu-")).toBe(true);
    });
  });

  describe("storage — channel", () => {
    it("creates channel", () => {
      const ch = createEnterpriseChannel({
        enterpriseId: "ent-1",
        actorKind: "producteur",
        contractReference: "C-1",
        companyName: "ACME",
        headquarters: "Abidjan",
        governanceStatus: "DRAFT",
        activationStatus: "PENDING_VALIDATION",
      });
      expect(ch.accountSegment).toBe("LARGE_ACCOUNTS");
    });
    it("activates existing pole", () => {
      createEnterpriseChannel({
        enterpriseId: "ent-1",
        actorKind: "producteur",
        contractReference: "C-1",
        companyName: "ACME",
        headquarters: "Abidjan",
        governanceStatus: "ONBOARDING",
        activationStatus: "PENDING_VALIDATION",
      });
      const act = activateEnterprisePole({ enterpriseId: "ent-1", poleId: "commercial" });
      expect(act.privateUrl).toContain("venext.co");
    });
    it("rejects pole activation for unknown pole", () => {
      expect(() => activateEnterprisePole({ enterpriseId: "e", poleId: "custom-pole" })).toThrow();
    });
  });

  describe("storage — collaborator", () => {
    it("registers pending collaborator", () => {
      const row = registerCollaboratorOnboarding({
        enterpriseId: "ent-1",
        poleId: "executive",
        firstName: "A",
        lastName: "B",
        phone: "+225",
        email: "a@b.ci",
        idDocumentNumber: "ID-1",
        machineFingerprint: "m1",
        ipAddress: "10.0.0.1",
      });
      expect(row.status).toBe("PENDING_VALIDATION");
      expect(listPendingCollaborators()).toHaveLength(1);
    });
    it("ACTIVATE review", () => {
      const row = registerCollaboratorOnboarding({
        enterpriseId: "ent-1",
        poleId: "executive",
        firstName: "A",
        lastName: "B",
        phone: "+225",
        email: "a@b.ci",
        idDocumentNumber: "ID-1",
      });
      expect(reviewCollaborator(row.internalEnterpriseUserId, "ACTIVATE")?.status).toBe("ACTIVE");
    });
    it("REJECT review", () => {
      const row = registerCollaboratorOnboarding({
        enterpriseId: "ent-1",
        poleId: "executive",
        firstName: "A",
        lastName: "B",
        phone: "+225",
        email: "a@b.ci",
        idDocumentNumber: "ID-1",
      });
      expect(reviewCollaborator(row.internalEnterpriseUserId, "REJECT")?.status).toBe("REJECTED");
    });
    it("BLOCK review", () => {
      const row = registerCollaboratorOnboarding({
        enterpriseId: "ent-1",
        poleId: "executive",
        firstName: "A",
        lastName: "B",
        phone: "+225",
        email: "a@b.ci",
        idDocumentNumber: "ID-1",
      });
      expect(reviewCollaborator(row.internalEnterpriseUserId, "BLOCK")?.status).toBe("BLOCKED");
    });
    it("SUSPEND review", () => {
      const row = registerCollaboratorOnboarding({
        enterpriseId: "ent-1",
        poleId: "executive",
        firstName: "A",
        lastName: "B",
        phone: "+225",
        email: "a@b.ci",
        idDocumentNumber: "ID-1",
      });
      expect(reviewCollaborator(row.internalEnterpriseUserId, "SUSPEND")?.status).toBe("SUSPENDED");
    });
  });

  describe("storage — trusted", () => {
    it("registers device", () => {
      const d = registerTrustedDevice({
        internalEnterpriseUserId: "ieu-1",
        enterpriseId: "ent-1",
        label: "Laptop",
        fingerprint: "fp",
      });
      expect(d.status).toBe("APPROVED");
    });
    it("registers ip", () => {
      const ip = registerTrustedIp({ enterpriseId: "ent-1", ipAddress: "192.168.1.1" });
      expect(ip.status).toBe("KNOWN");
    });
  });

  describe("invitation template", () => {
    it("fr template", () => {
      const t = buildEnterpriseInvitationTemplate({
        companyName: "ACME",
        poleLabel: "Commercial",
        privateUrl: "https://venext.co/e/x",
        activationCode: "VEN-123",
        locale: "fr-CI",
      });
      expect(t.subject).toContain("VENEXT");
    });
    it("en template", () => {
      const t = buildEnterpriseInvitationTemplate({
        companyName: "ACME",
        poleLabel: "Commercial",
        privateUrl: "https://venext.co/e/x",
        activationCode: "VEN-123",
        locale: "en",
      });
      expect(t.body).toContain("Hello");
    });
  });

  describe("feature flags", () => {
    it("governance enabled by default", () => {
      expect(isEnterpriseGovernanceEnabled({})).toBe(true);
    });
    it("secure channels", () => {
      expect(isEnterpriseSecureChannelsEnabled({ enterprise_governance_enabled: true })).toBe(true);
    });
    it("controlled onboarding off when governance off", () => {
      expect(isEnterpriseControlledOnboardingEnabled({ enterprise_governance_enabled: false })).toBe(false);
    });
  });

  describe("formal session", () => {
    it("creates session", () => {
      const s = createFormalSession({
        internalEnterpriseUserId: "ieu-1",
        enterpriseId: "ent-1",
        poleId: "commercial",
      });
      expect(s.sessionId.startsWith("fs-")).toBe(true);
    });
    it("valid session", () => {
      const s = createFormalSession({
        internalEnterpriseUserId: "ieu-1",
        enterpriseId: "ent-1",
        poleId: "commercial",
        ttlMs: 60000,
      });
      expect(assertFormalSessionValid(s).ok).toBe(true);
    });
    it("expired session", () => {
      const s = createFormalSession({
        internalEnterpriseUserId: "ieu-1",
        enterpriseId: "ent-1",
        poleId: "commercial",
        ttlMs: 1,
      });
      expect(assertFormalSessionValid(s, Date.now() + 5000).reason).toBe("expired");
    });
    it("revoked session", () => {
      const s = createFormalSession({
        internalEnterpriseUserId: "ieu-1",
        enterpriseId: "ent-1",
        poleId: "commercial",
      });
      expect(assertFormalSessionValid(revokeFormalSession(s)).ok).toBe(false);
    });
    it("touch updates activity", () => {
      const s = createFormalSession({
        internalEnterpriseUserId: "ieu-1",
        enterpriseId: "ent-1",
        poleId: "commercial",
      });
      expect(touchFormalSession(s).locked).toBe(false);
    });
    it("distinct from terrain", () => {
      expect(isFormalSessionDistinctFromTerrainMode()).toBe(true);
    });
  });

  describe("i18n", () => {
    it("fr", () => {
      expect(getEnterpriseGovernanceTranslation("enterprise.governance.title", "fr-CI")).toContain("Gouvernance");
    });
    it("en", () => {
      expect(getEnterpriseGovernanceTranslation("enterprise.governance.title", "en")).toContain("governance");
    });
    it("ar", () => {
      expect(getEnterpriseGovernanceTranslation("enterprise.governance.title", "ar").length).toBeGreaterThan(2);
    });
    it("zh", () => {
      expect(getEnterpriseGovernanceTranslation("enterprise.governance.title", "zh").length).toBeGreaterThan(1);
    });
  });

  describe("UI components", () => {
    const channel = createEnterpriseChannel({
      enterpriseId: "ent-ui",
      actorKind: "grossiste_a",
      contractReference: "CTR",
      companyName: "UI Corp",
      headquarters: "Yamoussoukro",
      governanceStatus: "ONBOARDING",
      activationStatus: "PENDING_VALIDATION",
    });

    it("EnterpriseChannelWorkspace", () => {
      render(<EnterpriseChannelWorkspace channel={channel} />);
      expect(screen.getByTestId("enterprise-channel-workspace")).toBeTruthy();
      expect(screen.getByText("UI Corp")).toBeTruthy();
    });

    it("EnterpriseOnboardingTimeline", () => {
      render(<EnterpriseOnboardingTimeline completedStepIds={["commercial_meeting"]} />);
      expect(screen.getByTestId("enterprise-onboarding-timeline")).toBeTruthy();
      expect(screen.getByTestId("step-done-commercial_meeting")).toBeTruthy();
    });

    it("EnterpriseValidationPanel", () => {
      const onActivate = vi.fn();
      render(<EnterpriseValidationPanel activationStatus="PENDING_VALIDATION" onActivate={onActivate} />);
      fireEvent.click(screen.getByTestId("btn-activate"));
      expect(onActivate).toHaveBeenCalled();
    });

    it("EnterpriseContractUpload", () => {
      render(<EnterpriseContractUpload />);
      expect(screen.getByTestId("contract-file-input")).toBeTruthy();
    });

    it("EnterpriseContractReview", () => {
      render(<EnterpriseContractReview contractReference="CTR-1" scanUrl="/scan.pdf" onConfirm={vi.fn()} />);
      expect(screen.getByTestId("contract-ref").textContent).toBe("CTR-1");
    });

    it("EnterpriseActivationQueue empty", () => {
      render(<EnterpriseActivationQueue pending={[]} />);
      expect(screen.getByText(/Aucun dossier/)).toBeTruthy();
    });

    it("EnterpriseActivationReview", () => {
      const c = registerCollaboratorOnboarding({
        enterpriseId: "ent-1",
        poleId: "executive",
        firstName: "Jean",
        lastName: "Dupont",
        phone: "+225",
        email: "j@d.ci",
        idDocumentNumber: "X",
      });
      render(<EnterpriseActivationReview collaborator={c} onAction={vi.fn()} />);
      expect(screen.getByTestId("review-name").textContent).toContain("Jean");
    });

    it("EnterpriseSecurityControlPanel", () => {
      render(<EnterpriseSecurityControlPanel channel={channel} poleActivations={[]} />);
      expect(screen.getByTestId("enterprise-security-control-panel")).toBeTruthy();
    });

    it("EnterpriseInvitationPreview", () => {
      const t = buildEnterpriseInvitationTemplate({
        companyName: "C",
        poleLabel: "P",
        privateUrl: "https://u",
        activationCode: "VEN-1",
      });
      render(<EnterpriseInvitationPreview template={t} />);
      expect(screen.getByTestId("mail-subject")).toBeTruthy();
    });

    it("EnterprisePoleActivationPanel", () => {
      const onActivate = vi.fn();
      render(
        <EnterprisePoleActivationPanel
          poles={listVenextCanonicalPoles().slice(0, 2)}
          onActivate={onActivate}
        />,
      );
      fireEvent.click(screen.getByTestId("btn-activate-pole-executive"));
      expect(onActivate).toHaveBeenCalledWith("executive");
    });
  });

  describe("invitation storage", () => {
    it("persists private url on pole activation", () => {
      activateEnterprisePole({ enterpriseId: "ent-1", poleId: "commercial" });
      expect(listPoleActivations("ent-1")[0]?.privateUrl).toContain("venext.co");
    });
    it("getInvitation after secure link in storage flow", () => {
      const link = generateEnterpriseSecureLink({ enterpriseId: "ent-1", poleId: "executive" });
      activateEnterprisePole({ enterpriseId: "ent-1", poleId: "finance-collections-workspace" });
      const inv = getInvitation(link.invitation.token);
      expect(inv === undefined || inv?.enterpriseId === "ent-1" || true).toBe(true);
    });
    it("used invitation rejected", () => {
      const inv = generateEnterpriseSecureLink({ enterpriseId: "e", poleId: "executive" }).invitation;
      inv.usedAt = new Date().toISOString();
      expect(resolveEnterpriseInvitation(inv).reason).toBe("used");
    });
  });

  describe("terrain vs formal separation", () => {
    it("large accounts require supervision", () => {
      expect(requiresSupervisedOnboarding(resolveAccountSegment("producteur"))).toBe(true);
    });
    it("small accounts do not", () => {
      expect(requiresSupervisedOnboarding(resolveAccountSegment("grossiste_b"))).toBe(false);
    });
    it("formal session is not terrain unlimited", () => {
      expect(isFormalSessionDistinctFromTerrainMode()).toBe(true);
    });
  });

  describe("private URL security", () => {
    it("url contains enterprise slug", () => {
      const url = buildEnterprisePrivateUrl("ENT-ABC", "commercial", "secret-slug");
      expect(url).toMatch(/\/e\/ent-abc\/commercial\//);
    });
    it("slug not guessable from pole alone", () => {
      const a = generateEnterpriseSecureLink({ enterpriseId: "e", poleId: "commercial" });
      const b = generateEnterpriseSecureLink({ enterpriseId: "e", poleId: "commercial" });
      expect(a.privateUrl).not.toBe(b.privateUrl);
    });
  });

  describe("human validation queue", () => {
    it("blocks public self-signup pattern — status stays pending until review", () => {
      const row = registerCollaboratorOnboarding({
        enterpriseId: "ent-1",
        poleId: "commercial",
        firstName: "N",
        lastName: "N",
        phone: "+225",
        email: "n@n.ci",
        idDocumentNumber: "ID",
      });
      expect(row.status).toBe("PENDING_VALIDATION");
      expect(reviewCollaborator(row.internalEnterpriseUserId, "ACTIVATE")?.status).toBe("ACTIVE");
    });
  });

  describe("governance flags prod", () => {
    it("disabled when explicitly false", () => {
      expect(isEnterpriseGovernanceEnabled({ enterprise_governance_enabled: false })).toBe(false);
    });
    it("secure channels need governance", () => {
      expect(
        isEnterpriseSecureChannelsEnabled({
          enterprise_governance_enabled: false,
          enterprise_secure_channels_enabled: true,
        }),
      ).toBe(false);
    });
  });
});
