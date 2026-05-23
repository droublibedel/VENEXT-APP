import type { EnterpriseSecurityAlert } from "./enterprise-governance.types";

const alerts: EnterpriseSecurityAlert[] = [];

export function createSecurityAlert(
  input: Omit<EnterpriseSecurityAlert, "id" | "createdAt" | "acknowledged">,
): EnterpriseSecurityAlert {
  const row: EnterpriseSecurityAlert = {
    ...input,
    id: `esa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    acknowledged: false,
  };
  alerts.push(row);
  return row;
}

export function listSecurityAlerts(enterpriseId: string): EnterpriseSecurityAlert[] {
  return alerts.filter((a) => a.enterpriseId === enterpriseId);
}

export function acknowledgeSecurityAlert(id: string): EnterpriseSecurityAlert | undefined {
  const row = alerts.find((a) => a.id === id);
  if (!row) return undefined;
  row.acknowledged = true;
  return row;
}

export function detectSecurityAlerts(input: {
  enterpriseId: string;
  ipAddress?: string;
  machineFingerprint?: string;
  knownIps: string[];
  knownDevices: string[];
  failedAttempts: number;
  invitationExpired?: boolean;
}): EnterpriseSecurityAlert[] {
  const created: EnterpriseSecurityAlert[] = [];
  if (input.invitationExpired) {
    created.push(
      createSecurityAlert({
        enterpriseId: input.enterpriseId,
        alertType: "invitation_expired",
        message: "Lien d'invitation expiré",
        severity: "info",
      }),
    );
  }
  if (input.ipAddress && !input.knownIps.includes(input.ipAddress)) {
    created.push(
      createSecurityAlert({
        enterpriseId: input.enterpriseId,
        alertType: "unknown_ip",
        message: `IP inconnue : ${input.ipAddress}`,
        severity: "warning",
      }),
    );
  }
  if (input.machineFingerprint && !input.knownDevices.includes(input.machineFingerprint)) {
    created.push(
      createSecurityAlert({
        enterpriseId: input.enterpriseId,
        alertType: "unknown_device",
        message: "Machine inconnue détectée",
        severity: "warning",
      }),
    );
  }
  if (input.failedAttempts >= 5) {
    created.push(
      createSecurityAlert({
        enterpriseId: input.enterpriseId,
        alertType: "too_many_attempts",
        message: "Trop de tentatives de connexion",
        severity: "warning",
      }),
    );
  }
  if (input.failedAttempts >= 3 && input.ipAddress) {
    created.push(
      createSecurityAlert({
        enterpriseId: input.enterpriseId,
        alertType: "unusual_login",
        message: "Tentative de connexion inhabituelle",
        severity: "warning",
      }),
    );
  }
  return created;
}

export function resetSecurityAlertsStorage(): void {
  alerts.length = 0;
}
