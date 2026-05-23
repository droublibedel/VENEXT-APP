/** Instruction 20.9A — V1 proof fileUrl hardening (relative uploads or HTTPS whitelist). */

export type ProofUrlValidationResult =
  | { ok: true; mode: "relative_uploads" | "https_whitelist"; host?: string }
  | { ok: false; reason: string };

const PRIVATE_IPV4 =
  /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

function parseAllowedHosts(): Set<string> {
  const raw = process.env.VENEXT_PROOF_FILE_ALLOWED_HOSTS?.trim() ?? "";
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  );
}

function isBlockedHostname(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "0.0.0.0") return true;
  if (PRIVATE_IPV4.test(h)) return true;
  if (h.includes("metadata") || h.includes("169.254.169.254")) return true;
  return false;
}

export function validateFulfillmentProofFileUrl(fileUrl: string): ProofUrlValidationResult {
  const trimmed = fileUrl.trim();
  if (!trimmed) return { ok: false, reason: "empty_url" };

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("http://") ||
    lower.startsWith("file://") ||
    lower.startsWith("ftp://") ||
    lower.startsWith("javascript:")
  ) {
    return { ok: false, reason: "scheme_not_allowed" };
  }

  if (trimmed.startsWith("/uploads/")) {
    if (trimmed.includes("..") || trimmed.includes("\\")) {
      return { ok: false, reason: "path_traversal" };
    }
    return { ok: true, mode: "relative_uploads" };
  }

  if (!trimmed.startsWith("https://")) {
    return { ok: false, reason: "must_be_relative_uploads_or_https" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: "malformed_url" };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "https_required" };
  }

  const host = parsed.hostname.toLowerCase();
  if (isBlockedHostname(host)) {
    return { ok: false, reason: "host_blocked" };
  }

  const allowed = parseAllowedHosts();
  if (!allowed.has(host)) {
    return { ok: false, reason: "host_not_whitelisted" };
  }

  return { ok: true, mode: "https_whitelist", host };
}
