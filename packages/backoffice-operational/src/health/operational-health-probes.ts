import { getBackofficeStore } from "../store/backoffice-store.js";

const HOUR_MS = 60 * 60 * 1000;

function recentErrors(module?: string, errorTypes?: string[]) {
  const store = getBackofficeStore();
  const since = Date.now() - HOUR_MS;
  return store.errors.filter((e) => {
    if (new Date(e.occurredAt).getTime() < since) return false;
    if (module && e.module !== module) return false;
    if (errorTypes?.length && !errorTypes.includes(e.errorType)) return false;
    return true;
  });
}

export type ModuleProbeResult = {
  ok: boolean;
  message?: string;
  incidentCount: number;
};

export function probeAuthFromLiveTraffic(): ModuleProbeResult {
  const incidents = recentErrors("auth", ["connection_error", "otp_invalid", "password_incorrect"]);
  return {
    ok: incidents.length < 12,
    incidentCount: incidents.length,
    message: incidents.length >= 12 ? "Pic erreurs auth (1h)" : undefined,
  };
}

export function probeWalletFromLiveTraffic(): ModuleProbeResult {
  const incidents = recentErrors("wallet", ["wallet_locked", "wallet_not_activated", "wallet_action_failed"]);
  return {
    ok: incidents.length < 6,
    incidentCount: incidents.length,
    message: incidents.length >= 6 ? "Incidents wallet (1h)" : undefined,
  };
}

export function probeMessagingFromLiveTraffic(): ModuleProbeResult {
  const incidents = recentErrors("messaging", ["message_not_sent"]);
  return {
    ok: incidents.length < 8,
    incidentCount: incidents.length,
    message: incidents.length >= 8 ? "Messaging dégradé (1h)" : undefined,
  };
}

export function probeNotificationsFromLiveTraffic(): ModuleProbeResult {
  const incidents = recentErrors("notifications", ["sync_failed"]);
  return {
    ok: incidents.length < 5,
    incidentCount: incidents.length,
    message: incidents.length >= 5 ? "Notifications instables" : undefined,
  };
}

export function probeCatalogueFromLiveTraffic(): ModuleProbeResult {
  const incidents = recentErrors("catalog", ["catalog_unavailable", "upload_failed", "image_error"]);
  return {
    ok: incidents.length < 6,
    incidentCount: incidents.length,
    message: incidents.length >= 6 ? "Catalogue/upload dégradé" : undefined,
  };
}

export function probeUploadFromLiveTraffic(): ModuleProbeResult {
  const incidents = recentErrors(undefined, ["upload_failed", "image_error", "invalid_file"]);
  return {
    ok: incidents.length < 4,
    incidentCount: incidents.length,
    message: incidents.length >= 4 ? "Upload média cassé (1h)" : undefined,
  };
}

export function probeOfflineSyncFromLiveTraffic(): ModuleProbeResult {
  const incidents = recentErrors(undefined, ["offline", "sync_failed", "cache_error"]);
  return {
    ok: incidents.length < 10,
    incidentCount: incidents.length,
    message: incidents.length >= 10 ? "Sync offline sous pression" : undefined,
  };
}

export function runCommerceOperationalHealthProbes(): Record<string, ModuleProbeResult> {
  return {
    auth: probeAuthFromLiveTraffic(),
    wallet: probeWalletFromLiveTraffic(),
    messaging: probeMessagingFromLiveTraffic(),
    notifications: probeNotificationsFromLiveTraffic(),
    catalogue: probeCatalogueFromLiveTraffic(),
    upload: probeUploadFromLiveTraffic(),
    offline_sync: probeOfflineSyncFromLiveTraffic(),
  };
}
