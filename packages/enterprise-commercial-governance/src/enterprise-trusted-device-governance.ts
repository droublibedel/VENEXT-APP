import type { EnterpriseTrustedDevice } from "./enterprise-governance.types";
import {
  getTrustedDevice,
  listTrustedDevices,
  registerTrustedDevice,
  saveTrustedDevice,
} from "./enterprise-governance-storage";
import { revokeTrustedDevice } from "./enterprise-trusted-device";

export type EnterpriseTrustedDeviceHistoryEntry = {
  deviceId: string;
  enterpriseId: string;
  internalEnterpriseUserId: string;
  action: "APPROVED" | "REVOKED" | "ROTATED" | "AUTO_REVOKED_LIMIT";
  at: string;
  label?: string;
};

const deviceHistory: EnterpriseTrustedDeviceHistoryEntry[] = [];
export const DEFAULT_MAX_SIMULTANEOUS_DEVICES = 3;

export function listEnterpriseTrustedDeviceHistory(
  enterpriseId: string,
): EnterpriseTrustedDeviceHistoryEntry[] {
  return deviceHistory.filter((h) => h.enterpriseId === enterpriseId);
}

function pushDeviceHistory(entry: Omit<EnterpriseTrustedDeviceHistoryEntry, "at">): void {
  deviceHistory.push({ ...entry, at: new Date().toISOString() });
}

export function revokeEnterpriseDevice(deviceId: string): EnterpriseTrustedDevice | undefined {
  const device = getTrustedDevice(deviceId);
  if (!device) return undefined;
  const revoked = revokeTrustedDevice(device);
  saveTrustedDevice(revoked);
  pushDeviceHistory({
    deviceId,
    enterpriseId: device.enterpriseId,
    internalEnterpriseUserId: device.internalEnterpriseUserId,
    action: "REVOKED",
    label: device.label,
  });
  return revoked;
}

export function rotateEnterpriseTrustedDevice(input: {
  previousDeviceId: string;
  newDevice: Omit<EnterpriseTrustedDevice, "id" | "status">;
}): { revoked: EnterpriseTrustedDevice; replacement: EnterpriseTrustedDevice } {
  const revoked = revokeEnterpriseDevice(input.previousDeviceId);
  if (!revoked) throw new Error("DEVICE_NOT_FOUND");
  const replacement = registerTrustedDevice(input.newDevice);
  pushDeviceHistory({
    deviceId: replacement.id,
    enterpriseId: replacement.enterpriseId,
    internalEnterpriseUserId: replacement.internalEnterpriseUserId,
    action: "ROTATED",
    label: replacement.label,
  });
  return { revoked, replacement };
}

export function enforceEnterpriseDeviceLimit(
  enterpriseId: string,
  maxDevices = DEFAULT_MAX_SIMULTANEOUS_DEVICES,
): number {
  const active = listTrustedDevices(enterpriseId).filter((d) => d.status === "APPROVED");
  if (active.length <= maxDevices) return 0;
  const sorted = [...active].sort(
    (a, b) => new Date(a.lastSeenAt ?? 0).getTime() - new Date(b.lastSeenAt ?? 0).getTime(),
  );
  let revoked = 0;
  while (sorted.length > maxDevices) {
    const oldest = sorted.shift()!;
    revokeEnterpriseDevice(oldest.id);
    pushDeviceHistory({
      deviceId: oldest.id,
      enterpriseId,
      internalEnterpriseUserId: oldest.internalEnterpriseUserId,
      action: "AUTO_REVOKED_LIMIT",
      label: oldest.label,
    });
    revoked += 1;
  }
  return revoked;
}

export function resetEnterpriseTrustedDeviceHistory(): void {
  deviceHistory.length = 0;
}
