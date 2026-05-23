import type { WalletIdentityDocument, WalletIdentityDocumentType, WalletKycIntent } from "./venext-wallet-security.types";

const ACCEPTED_DOCUMENT_TYPES: WalletIdentityDocumentType[] = [
  "CNI",
  "PASSEPORT",
  "PERMIS",
  "CARTE_CONSULAIRE",
];

export function requiresBceaoKyc(intent: WalletKycIntent): boolean {
  return intent === "receive" || intent === "hold" || intent === "pay";
}

export function kycBlocksCommerceOnboarding(): boolean {
  return false;
}

export function validateWalletIdentityDocument(
  doc: Partial<WalletIdentityDocument>,
): { valid: boolean; reason?: string; message?: string } {
  if (!doc.firstName?.trim() || !doc.lastName?.trim()) {
    return {
      valid: false,
      reason: "identity-incomplete",
      message: "Indiquez votre nom et prénom pour activer les règlements.",
    };
  }
  if (!doc.birthDate?.trim() || doc.birthDate.length < 8) {
    return {
      valid: false,
      reason: "birthdate-invalid",
      message: "La date de naissance est requise.",
    };
  }
  if (!doc.documentType || !ACCEPTED_DOCUMENT_TYPES.includes(doc.documentType)) {
    return {
      valid: false,
      reason: "document-type-invalid",
      message: "Choisissez un type de pièce accepté (CNI, passeport, permis).",
    };
  }
  if (!doc.documentNumber?.trim() || doc.documentNumber.trim().length < 4) {
    return {
      valid: false,
      reason: "document-number-invalid",
      message: "Le numéro de pièce est requis.",
    };
  }
  if (!doc.photoQuality || doc.photoQuality === "missing") {
    return {
      valid: false,
      reason: "photo-missing",
      message: "Ajoutez une photo lisible de votre pièce.",
    };
  }
  if (doc.photoQuality === "blur") {
    return {
      valid: false,
      reason: "photo-blur",
      message: "La photo n'est pas assez nette. Reprenez-la dans un endroit lumineux.",
    };
  }
  if (doc.photoQuality === "incomplete") {
    return {
      valid: false,
      reason: "photo-incomplete",
      message: "La pièce doit être entièrement visible sur la photo.",
    };
  }
  return { valid: true };
}

export function walletActivationSteps(): readonly [
  "activation",
  "identity",
  "document",
  "pin",
  "biometric",
  "done",
] {
  return ["activation", "identity", "document", "pin", "biometric", "done"] as const;
}

export function nextWalletActivationStep(
  current: import("./venext-wallet-security.types").WalletActivationStep,
): import("./venext-wallet-security.types").WalletActivationStep {
  const steps = walletActivationSteps();
  const idx = Math.max(0, steps.indexOf(current));
  const next = steps[Math.min(idx + 1, steps.length - 1)];
  return next ?? "done";
}
