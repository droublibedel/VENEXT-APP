/** Masquage données sensibles par défaut (Instruction BACKOFFICE-01 §25). */
export function maskPhone(phone: string | undefined, reveal = false): string | undefined {
  if (!phone) return undefined;
  if (reveal) return phone;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `${phone.slice(0, 4)}••••${digits.slice(-2)}`;
}

export function maskEmail(email: string | undefined, reveal = false): string | undefined {
  if (!email) return undefined;
  if (reveal) return email;
  const [user, domain] = email.split("@");
  if (!domain) return "•••@•••";
  return `${(user ?? "").slice(0, 2)}•••@${domain}`;
}

export function neverExposeSecret(_value: string | undefined): undefined {
  return undefined;
}
