import { resetEnterpriseGovernanceStorage } from "./enterprise-governance-storage";
import { resetGovernanceHistoryStorage } from "./enterprise-governance-history";
import { resetSecurityAlertsStorage } from "./enterprise-security-alerts";
import { resetFormalSessionsStorage } from "./enterprise-security-sessions";
import { resetEnterpriseSecurityGovernanceStorage } from "./enterprise-security-governance";
import { resetEnterpriseTrustedDeviceHistory } from "./enterprise-trusted-device-governance";

export function resetAllEnterpriseGovernanceStorage(): void {
  resetEnterpriseGovernanceStorage();
  resetGovernanceHistoryStorage();
  resetSecurityAlertsStorage();
  resetFormalSessionsStorage();
  resetEnterpriseSecurityGovernanceStorage();
  resetEnterpriseTrustedDeviceHistory();
}
