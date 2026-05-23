export type VenextDeviceFingerprint = {
  platform: "web" | "mobile" | "unknown";
  userAgent?: string;
  label: string;
};

export function detectDeviceFingerprint(): VenextDeviceFingerprint {
  if (typeof navigator === "undefined") {
    return { platform: "unknown", label: "unknown" };
  }
  const ua = navigator.userAgent ?? "";
  const mobile = /mobile|android|iphone|ipad/i.test(ua);
  return {
    platform: mobile ? "mobile" : "web",
    userAgent: ua.slice(0, 120),
    label: mobile ? "mobile" : "web",
  };
}
