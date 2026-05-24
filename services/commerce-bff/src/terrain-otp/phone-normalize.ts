/** Normalise un numéro ivoirien pour Yellika (ex. 2250701020304). */
export function normalizeCiPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("225")) {
    const local = digits.slice(3);
    if (local.length === 10 && local.startsWith("0")) return `225${local}`;
    if (local.length >= 8 && local.length <= 10) return `225${local}`;
    return null;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `225${digits}`;
  }

  if (digits.startsWith("0") && digits.length >= 9 && digits.length <= 10) {
    return `225${digits.slice(1)}`;
  }

  if (digits.length >= 8 && digits.length <= 10) {
    return `225${digits}`;
  }

  return null;
}

/** Format E.164 pour envoi SMS (ex. +2250701020304). */
export function formatInternationalPhone(digits: string): string {
  const normalized = digits.replace(/\D/g, "");
  if (!normalized) return digits;
  return `+${normalized}`;
}

export function maskPhone(recipient: string): string {
  if (recipient.length <= 4) return "****";
  return `***${recipient.slice(-4)}`;
}
