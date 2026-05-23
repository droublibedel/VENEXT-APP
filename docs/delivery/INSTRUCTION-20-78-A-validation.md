# Instruction 20.78-A — validation livrable

Sécurité adaptative terrain et gouvernance wallet BCEAO (complément de 20.78).

**Aucun commit git.**

## Modes sécurité

| Mode | Déclencheur | Comportement |
| --- | --- | --- |
| `LIGHT_COMMERCE_MODE` | Solde &lt; 1 000 FCFA (terrain B/D) | Session illimitée, pas de PIN, pas de verrouillage |
| `SECURED_WALLET_MODE` | Solde ≥ 1 000 FCFA ou `SECURED_LATCHED` | PIN 4 chiffres, timeout 20 min, verrouillage à la sortie d’app |
| Formel (Producteur / Grossiste A) | `FORMAL_SECURITY_MODEL` | Sécurité structurée, pas de session terrain illimitée |

Seuil : `BCEAO_SECURED_BALANCE_THRESHOLD_FCFA = 1000`.

## Package `packages/venext-auth-foundation/`

**Cœur**

- `venext-wallet-security-mode.ts` — `resolveWalletSecurityMode()`, latch `SECURED_LATCHED`
- `venext-wallet-adaptive-session.ts` — session terrain illimitée, `parseWalletBalanceFcfa()`
- `venext-wallet-security-kyc.ts` — KYC receive/hold/pay uniquement, `validateWalletIdentityDocument()`
- `venext-wallet-security-pin.ts` — PIN exactement 4 chiffres
- `venext-wallet-security-session.ts` — verrouillage, restauration, timeout 20 min
- `venext-wallet-balance-sync.ts` — sync solde → provider auth + sécurité

**UI**

- `WalletBceaoActivationFlow.tsx` — activation → identité → pièce → PIN → biométrie (optionnel)
- `WalletSecuredLockGate.tsx` — déverrouillage PIN / biométrie
- `WalletAdaptiveSecurityShell.tsx` — enchaîne activation puis lock gate
- `VenextWalletSecurityProvider` + `useWalletBalanceSync`

## Pont `packages/commerce-wallet/`

- `adaptive-wallet-security-bridge.ts` — `parseBalanceLabelToFcfa`, constante seuil (sans dépendance circulaire vers auth)

## Intégration apps

| App | Fichiers |
| --- | --- |
| mobile-grossiste-b | `GrossisteBAuthProvider`, `GrossisteBWalletScreen`, feature flags |
| mobile-detaillant | `DetaillantAuthProvider`, `DetaillantWalletScreen`, feature flags |
| web-grossiste-a | `GrossisteAAuthProvider`, flags |
| web-industrial-nextjs | `ProducerAuthProvider`, `useIndustrialFeatureFlags` |

Feature flags (DEV true / PROD false) : `terrain_unlimited_session_enabled`, `wallet_adaptive_security_enabled`, `wallet_bceao_kyc_enabled`, `wallet_biometric_unlock_enabled` — synchronisés dans `prisma/seed.ts` et hooks acteurs.

## Tests

| Cible | Fichier | ~Tests |
| --- | --- | --- |
| venext-auth-foundation | `venext-wallet-security.spec.ts` | 30 |
| venext-auth-foundation | `wallet-adaptive-security.spec.tsx` | 5 |
| commerce-wallet | `adaptive-wallet-security-bridge.spec.ts` | 3 |
| mobile-grossiste-b | `grossiste-b-wallet-security.spec.tsx` | 2 |
| mobile-detaillant | `detaillant-wallet-security.spec.tsx` | 2 |

## Build matrix

```bash
pnpm --filter venext-auth-foundation build && pnpm --filter venext-auth-foundation test
pnpm --filter commerce-wallet build && pnpm --filter commerce-wallet test
pnpm --filter mobile-grossiste-b test
pnpm --filter mobile-detaillant test
```

## Confirmations

- Session terrain type WhatsApp tant que solde &lt; 1 000 FCFA
- Mode sécurisé uniquement avec argent réel (ou latch), pas à l’activation wallet seule
- KYC BCEAO non bloquant pour catalogue / commandes / messaging
- Producteur et Grossiste A hors logique terrain illimitée
- Aucune dérive fintech enterprise (PIN 4 chiffres, messages humains)

## Limitations restantes

- Biométrie simulée côté web (détection user-agent, pas WebAuthn réel)
- Hash PIN local démo (`btoa`), pas HSM / serveur
- KYC photo « démo » (bouton « Photo ajoutée ») — pas d’upload OCR
- Solde mock commerce-wallet élevé (1,24 M FCFA) déclenche le mode sécurisé en dev si non synchronisé à 0
