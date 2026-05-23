import type { EnterpriseTrustedDevice } from "./enterprise-governance.types";

export function approveTrustedDevice(
  device: EnterpriseTrustedDevice,
): EnterpriseTrustedDevice {
  return { ...device, status: "APPROVED", lastSeenAt: new Date().toISOString() };
}

export function revokeTrustedDevice(device: EnterpriseTrustedDevice): EnterpriseTrustedDevice {
  return { ...device, status: "REVOKED" };
}

export function suspendTrustedDevice(device: EnterpriseTrustedDevice): EnterpriseTrustedDevice {
  return { ...device, status: "SUSPENDED" };
}

export function isTrustedDeviceActive(device: EnterpriseTrustedDevice): boolean {
  return device.status === "APPROVED";
}
