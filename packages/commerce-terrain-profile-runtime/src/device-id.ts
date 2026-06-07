let deviceId: string | null = null;

export function getDeviceId(): string {
  if (deviceId) return deviceId;
  const storageKey = "venext_terrain_device_id_v1";
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing) {
      deviceId = existing;
      return existing;
    }
  } catch {
    // ignore
  }
  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `device-${crypto.randomUUID()}`
      : `device-${Date.now()}`;
  deviceId = next;
  try {
    localStorage.setItem(storageKey, next);
  } catch {
    // ignore
  }
  return next;
}

export function resetDeviceIdForTests(): void {
  deviceId = null;
  localStorage.removeItem("venext_terrain_device_id_v1");
}
