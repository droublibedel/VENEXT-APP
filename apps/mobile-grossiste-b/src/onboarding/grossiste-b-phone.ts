const LOCAL_CI_PHONE_PATTERN = /^0\d{9}$/;

export function sanitizeLocalCiPhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("225") && digits.length > 10) {
    digits = digits.slice(3);
  }
  if (digits.length > 0 && !digits.startsWith("0")) {
    digits = `0${digits}`;
  }
  return digits.slice(0, 10);
}

export function formatLocalCiPhoneDisplay(digits: string): string {
  const d = sanitizeLocalCiPhoneInput(digits);
  if (d.length <= 2) return d;
  const parts = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean);
  return parts.join(" ");
}

export function isValidLocalCiPhone(phone: string): boolean {
  return LOCAL_CI_PHONE_PATTERN.test(sanitizeLocalCiPhoneInput(phone));
}

export function toInternationalCiPhone(local: string): string {
  const digits = sanitizeLocalCiPhoneInput(local);
  if (!LOCAL_CI_PHONE_PATTERN.test(digits)) return local.trim();
  return `+225${digits}`;
}
