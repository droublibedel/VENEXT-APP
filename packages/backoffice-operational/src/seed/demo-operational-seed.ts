import { getBackofficeStore } from "../store/backoffice-store.js";
import { seedBackofficeFeatureFlags } from "../flags/backoffice-feature-flags.js";
import { captureTechnicalErrorForBackoffice, reportUserFacingError } from "../errors/error-pipeline.js";
import { trackJourneyStart, trackJourneyStep, markJourneyBlocked, trackJourneyAbandon } from "../sdk/journey-tracking.js";
import { defaultHealth } from "../services/operational-readouts.js";
import { syncEnterpriseGovernanceToBackoffice } from "../governance/sync-enterprise-governance.js";
import { isBackofficeLiveGovernanceFlagEnabled } from "../persistence/persistence-mode.js";

export async function seedOperationalDemoData(): Promise<void> {
  seedBackofficeFeatureFlags("development");
  getBackofficeStore().health = defaultHealth();

  if (isBackofficeLiveGovernanceFlagEnabled()) {
    await syncEnterpriseGovernanceToBackoffice();
  }

  if (getBackofficeStore().users.length > 0) return;

  getBackofficeStore().users = [
    {
      id: "u-demo-1",
      fullName: "Khadija Sy",
      phone: "+221700000003",
      email: "khadija.sy@example.ci",
      actorRole: "GROSSISTE_B",
      organizationId: "org-grossiste-b-demo",
      organizationName: "Grossiste B Démo",
      city: "Abidjan",
      device: "Android 14",
      lastAccessAt: new Date().toISOString(),
      sessionActive: true,
      securityStatus: "ok",
      walletStatus: "ACTIVE",
    },
  ];

  getBackofficeStore().documents = [
    {
      id: "doc-demo-1",
      title: "Contrat cadre AgroNexus",
      kind: "contract",
      enterpriseId: "ent-demo-1",
      uploadedAt: new Date().toISOString(),
      fileRef: "governance://contracts/CTR-2026-001.pdf",
    },
  ];

  getBackofficeStore().enterprises = [
    {
      id: "ent-demo-1",
      name: "AgroNexus CI",
      channelStatus: "pending",
      contractRef: "CTR-2026-001",
      polesActivated: ["executive", "commercial"],
      activeCollaborators: 12,
      suspendedUsers: 1,
      pendingInvitations: 3,
      securityAlerts: 1,
    },
  ];

  await reportUserFacingError({
    commerceErrorKey: "otp_invalid",
    technicalMessage: "OTP mismatch after 2 attempts",
    userId: "u-demo-2",
    userPhone: "+221700000002",
    application: "mobile-grossiste-b",
    screen: "LoginOtp",
    action: "verify_otp",
    routeOrApi: "POST /auth/verify-otp",
  });

  await captureTechnicalErrorForBackoffice({
    commerceErrorKey: "wallet_locked",
    technicalMessage: "Wallet locked — background exit",
    userId: "u-demo-2",
    application: "mobile-grossiste-b",
    screen: "WalletHome",
    commercialContext: { walletBalance: 150000 },
    severity: "critical",
  });

  const j1 = trackJourneyStart({
    journeyKey: "login",
    actorId: "actor-2",
    actorRole: "GROSSISTE_A",
    application: "web-grossiste-a",
    userId: "u-demo-2",
  });
  if (j1) {
    trackJourneyStep(j1.journeyId, "otp_sent");
    markJourneyBlocked(j1.journeyId, "OTP_FAILED");
  }

  const abandoned = trackJourneyStart({
    journeyKey: "terrain_onboarding",
    actorId: "actor-3",
    actorRole: "GROSSISTE_B",
    application: "mobile-grossiste-b",
  });
  if (abandoned) trackJourneyAbandon(abandoned.journeyId, "USER_LEFT");
}
