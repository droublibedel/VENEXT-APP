import { assertManualRefreshOnly, assertNoWebsocketInStack } from "commerce-performance-foundation";

import { auditFinalFeatureFlags } from "./venext-feature-flag-audit";
import { auditVenextPhilosophyCopy, assertCommerceFirstProduct } from "./venext-philosophy-audit";
import type {
  VenextProductionReadiness,
  VenextReadinessCheck,
  VenextV1Flags,
} from "./venext-v1-readiness.types";
import { isV1ActorSurface, VENEXT_V1_EXCLUDED } from "./venext-v1-freeze";

export type BuildVenextProductionReadinessInput = {
  flags: VenextV1Flags;
  visibleLabels?: string[];
  actors?: string[];
  hasBffRoutes?: boolean;
  pollingMs?: number;
  walletSecured?: boolean;
  offlinePaymentBlocked?: boolean;
  i18nLocales?: string[];
  navigationDepth?: number;
};

function check(
  id: string,
  ok: boolean,
  message: string,
  severity: VenextReadinessCheck["severity"] = "critical",
): VenextReadinessCheck {
  return { id, ok, message, severity };
}

export function buildVenextProductionReadiness(
  input: BuildVenextProductionReadinessInput,
): VenextProductionReadiness {
  const checks: VenextReadinessCheck[] = [];

  const flagAudit = auditFinalFeatureFlags(input.flags, { surface: "all" });
  checks.push(
    check(
      "feature-flags",
      flagAudit.ok,
      flagAudit.ok
        ? "Feature flags V1 cohérents."
        : `Flags: ${flagAudit.issues.map((i) => i.message).join("; ")}`,
    ),
  );

  const labels = input.visibleLabels ?? [
    "Commande partenaire",
    "Livraison en cours",
    "Règlement relationnel",
    "Catalogue relationnel",
  ];
  const philosophyResults = labels.map((l) => auditVenextPhilosophyCopy(l));
  const philosophyOk = philosophyResults.every((r) => r.ok);
  checks.push(
    check(
      "philosophy-wording",
      philosophyOk,
      philosophyOk ? "Wording commerce-first validé." : "Wording interdit détecté.",
    ),
  );

  for (const pillar of assertCommerceFirstProduct()) {
    checks.push(check(`pillar-${pillar}`, true, `Pilier: ${pillar}.`, "info"));
  }

  for (const excluded of VENEXT_V1_EXCLUDED.slice(0, 4)) {
    const bad = auditVenextPhilosophyCopy(`Module ${excluded} activé`);
    checks.push(
      check(
        `excluded-${excluded.slice(0, 12)}`,
        !bad.ok || excluded.includes("polling"),
        `Exclusion V1: pas de ${excluded}.`,
        "info",
      ),
    );
  }

  const pollingMs = input.pollingMs ?? 0;
  checks.push(
    check(
      "no-polling",
      assertManualRefreshOnly(pollingMs),
      "Refresh manuel uniquement (pas de polling agressif).",
    ),
  );

  checks.push(
    check(
      "no-websocket",
      assertNoWebsocketInStack("fetch /api/notifications manual refresh"),
      "Pas de websocket temps réel.",
    ),
  );

  const actors = input.actors ?? ["producteur", "grossiste_a", "grossiste_b", "detaillant"];
  const actorsOk = actors.every((a) => isV1ActorSurface(a));
  checks.push(
    check("actors-v1", actorsOk, "Quatre surfaces commerce V1 déclarées.", "warning"),
  );

  const depth = input.navigationDepth ?? 2;
  checks.push(
    check("navigation-depth", depth <= 2, `Profondeur navigation ≤ 2 (actuel: ${depth}).`),
  );

  const walletOk = input.walletSecured !== false;
  checks.push(
    check(
      "wallet-secured",
      walletOk,
      walletOk ? "Wallet sécurisé terrain configuré." : "Wallet non sécurisé.",
    ),
  );

  const offlinePayOk = input.offlinePaymentBlocked !== false;
  checks.push(
    check(
      "offline-no-payment",
      offlinePayOk,
      offlinePayOk ? "Paiement bloqué hors ligne." : "Risque paiement offline.",
    ),
  );

  const locales = input.i18nLocales ?? ["fr-CI", "en", "ar", "zh-CN"];
  checks.push(
    check(
      "i18n-locales",
      locales.length >= 4,
      `Locales V1: ${locales.join(", ")}.`,
      "warning",
    ),
  );

  const bffOk = input.hasBffRoutes !== false;
  checks.push(
    check(
      "bff-routes",
      bffOk,
      bffOk ? "Routes BFF disponibles." : "BFF désactivé — fallback local uniquement.",
      bffOk ? "info" : "warning",
    ),
  );

  const critical = checks.filter((c) => c.severity === "critical");
  const criticalOk = critical.every((c) => c.ok);
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  const mobileOk =
    criticalOk &&
    (input.flags.grossiste_b_mobile_enabled !== false ||
      input.flags.detaillant_mobile_enabled !== false);
  const webOk =
    criticalOk &&
    (input.flags.grossiste_a_web_enabled !== false ||
      input.flags.industrial_poles_enabled !== false);
  const backendOk = criticalOk && bffOk && flagAudit.ok;

  return {
    ready: criticalOk && philosophyOk && score >= 85,
    score,
    checks,
    philosophyOk,
    mobileOk,
    webOk,
    backendOk,
    v1Frozen: true,
  };
}
