export type FormalPasswordStrength = {
  score: number;
  ok: boolean;
  hints: string[];
};

export function buildFormalPasswordStrength(password: string): FormalPasswordStrength {
  const hints: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else hints.push("Minimum 8 caractères");

  if (/[A-Z]/.test(password)) score += 1;
  else hints.push("Une majuscule obligatoire");

  if (/[0-9]/.test(password)) score += 1;
  else hints.push("Un chiffre obligatoire");

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else hints.push("Symbole recommandé");

  if (password.length >= 12) score += 1;

  const ok = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  return { score, ok, hints };
}

export function validateFormalPassword(password: string): { valid: boolean; strength: FormalPasswordStrength } {
  const strength = buildFormalPasswordStrength(password);
  return { valid: strength.ok, strength };
}
