import { Injectable } from "@nestjs/common";
import type {
  RelationalOperationalOrchestrationPriority,
  RelationalOperationalOrchestrationType,
  RelationalOperationalRecommendationType,
} from "@prisma/client";

export const ORCHESTRATION_ENGINE_THRESHOLDS = {
  cooldownHours: Number(process.env.VENEXT_ORCHESTRATION_COOLDOWN_HOURS ?? 48),
  maxActiveCritical: Number(process.env.VENEXT_ORCHESTRATION_MAX_ACTIVE_CRITICAL ?? 2),
  maxActivePerRelationship: Number(process.env.VENEXT_ORCHESTRATION_MAX_ACTIVE ?? 10),
  expirationDays: Number(process.env.VENEXT_ORCHESTRATION_EXPIRATION_DAYS ?? 21),
} as const;

export type OrchestrationStepTemplate = {
  stepCode: string;
  stepTitle: string;
  stepDescription: string;
  stepOrder: number;
  blockingStep: boolean;
};

export type OrchestrationPlanCandidate = {
  code: string;
  type: RelationalOperationalOrchestrationType;
  priority: RelationalOperationalOrchestrationPriority;
  title: string;
  description: string;
  riskScore: number;
  confidenceLevel: number;
  requiresHumanValidation: boolean;
  steps: OrchestrationStepTemplate[];
  diagnostics?: Record<string, unknown>;
};

const HUMAN_VALIDATION_TYPES: RelationalOperationalOrchestrationType[] = [
  "COLLAPSE_PREVENTION",
  "GOVERNANCE_REVIEW",
  "CORRIDOR_RECOVERY",
];

const CONFLICTING_ACTIVE_TYPES: RelationalOperationalOrchestrationType[][] = [
  ["COLLAPSE_PREVENTION", "CORRIDOR_RECOVERY"],
  ["GOVERNANCE_REVIEW", "CORRIDOR_RECOVERY"],
];

const RECOMMENDATION_TO_ORCHESTRATION: Record<
  RelationalOperationalRecommendationType,
  RelationalOperationalOrchestrationType
> = {
  SLA_DEGRADATION_RECOMMENDATION: "SLA_STABILIZATION",
  INCIDENT_ESCALATION_RECOMMENDATION: "INCIDENT_CONTAINMENT",
  EXECUTION_STABILIZATION_RECOMMENDATION: "EXECUTION_RECOVERY",
  FULFILLMENT_RISK_RECOMMENDATION: "FULFILLMENT_STABILIZATION",
  COORDINATION_OVERLOAD_RECOMMENDATION: "COORDINATION_REBALANCING",
  CORRIDOR_GOVERNANCE_RECOMMENDATION: "GOVERNANCE_REVIEW",
  COLLAPSE_PREVENTION_RECOMMENDATION: "COLLAPSE_PREVENTION",
  OPERATIONAL_REVIEW_RECOMMENDATION: "CORRIDOR_RECOVERY",
  PARTNER_VALIDATION_RECOMMENDATION: "PARTNER_ALIGNMENT",
  DOCUMENT_VALIDATION_RECOMMENDATION: "DOCUMENT_REINFORCEMENT",
};

@Injectable()
export class RelationalOperationalOrchestrationPolicyService {
  mapRecommendationType(rec: RelationalOperationalRecommendationType): RelationalOperationalOrchestrationType {
    return RECOMMENDATION_TO_ORCHESTRATION[rec];
  }

  requiresHumanValidation(type: RelationalOperationalOrchestrationType): boolean {
    return HUMAN_VALIDATION_TYPES.includes(type);
  }

  priorityFromRiskScore(score: number): RelationalOperationalOrchestrationPriority {
    if (score >= 85) return "CRITICAL";
    if (score >= 65) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }

  buildCode(type: RelationalOperationalOrchestrationType, relationshipId: string, suffix?: string): string {
    const base = `${type}:${relationshipId.slice(0, 8)}`;
    return suffix ? `${base}:${suffix}` : base;
  }

  isWithinCooldown(lastCreatedAt: Date | null, now: Date): boolean {
    if (!lastCreatedAt) return false;
    const ms = ORCHESTRATION_ENGINE_THRESHOLDS.cooldownHours * 60 * 60 * 1000;
    return now.getTime() - lastCreatedAt.getTime() < ms;
  }

  hasConflictingActive(
    newType: RelationalOperationalOrchestrationType,
    activeTypes: RelationalOperationalOrchestrationType[],
  ): boolean {
    for (const pair of CONFLICTING_ACTIVE_TYPES) {
      if (!pair.includes(newType)) continue;
      const other = pair.find((t) => t !== newType)!;
      if (activeTypes.includes(other)) return true;
    }
    return false;
  }

  stepTemplatesFor(type: RelationalOperationalOrchestrationType): OrchestrationStepTemplate[] {
    const plans: Record<RelationalOperationalOrchestrationType, OrchestrationStepTemplate[]> = {
      SLA_STABILIZATION: [
        { stepCode: "sla_audit", stepTitle: "Audit SLA corridor", stepDescription: "Revue déterministe des métriques SLA et délais fulfillment.", stepOrder: 1, blockingStep: true },
        { stepCode: "sla_align", stepTitle: "Alignement exécution", stepDescription: "Séquencer transitions exécution pour réduire dérive SLA.", stepOrder: 2, blockingStep: false },
        { stepCode: "sla_validate", stepTitle: "Validation stabilisation", stepDescription: "Contrôle humain de la stabilisation SLA avant reprise charge.", stepOrder: 3, blockingStep: true },
      ],
      INCIDENT_CONTAINMENT: [
        { stepCode: "incident_triage", stepTitle: "Triage incidents", stepDescription: "Classifier incidents fulfillment ouverts par criticité.", stepOrder: 1, blockingStep: true },
        { stepCode: "incident_contain", stepTitle: "Containment opérationnel", stepDescription: "Isoler étapes bloquantes — workflow résolution 20.10.", stepOrder: 2, blockingStep: true },
        { stepCode: "incident_close_loop", stepTitle: "Boucle clôture", stepDescription: "Valider résolution partenaire et preuves associées.", stepOrder: 3, blockingStep: false },
      ],
      EXECUTION_RECOVERY: [
        { stepCode: "exec_diagnose", stepTitle: "Diagnostic exécution", stepDescription: "Analyser séquence transitions 20.8 et statuts bloqués.", stepOrder: 1, blockingStep: true },
        { stepCode: "exec_stabilize", stepTitle: "Stabiliser séquence", stepDescription: "Réordonner transitions sans mutation commerce automatique.", stepOrder: 2, blockingStep: true },
      ],
      FULFILLMENT_STABILIZATION: [
        { stepCode: "fulfill_audit", stepTitle: "Audit fulfillment", stepDescription: "Revue stagnation et preuves non validées.", stepOrder: 1, blockingStep: true },
        { stepCode: "fulfill_reception", stepTitle: "Validation réception", stepDescription: "Aligner buyer/seller sur clôture fulfillment.", stepOrder: 2, blockingStep: false },
      ],
      CORRIDOR_RECOVERY: [
        { stepCode: "corridor_review", stepTitle: "Revue corridor", stepDescription: "Revue opérationnelle complète du corridor dégradé.", stepOrder: 1, blockingStep: true },
        { stepCode: "corridor_stabilize", stepTitle: "Plan stabilisation", stepDescription: "Séquencer actions de réduction risque sans autopilot.", stepOrder: 2, blockingStep: true },
        { stepCode: "corridor_signoff", stepTitle: "Sign-off humain", stepDescription: "Validation humaine obligatoire avant reprise ACTIVE.", stepOrder: 3, blockingStep: true },
      ],
      COORDINATION_REBALANCING: [
        { stepCode: "coord_inventory", stepTitle: "Inventaire tâches", stepDescription: "Lister tâches ouvertes et charge coordination 20.11.", stepOrder: 1, blockingStep: true },
        { stepCode: "coord_rebalance", stepTitle: "Rééquilibrage", stepDescription: "Réassigner ou clôturer tâches non bloquantes.", stepOrder: 2, blockingStep: false },
      ],
      GOVERNANCE_REVIEW: [
        { stepCode: "gov_assess", stepTitle: "Évaluation gouvernance", stepDescription: "Revue état corridor BLOCKED/DEGRADED/SUSPENDED.", stepOrder: 1, blockingStep: true },
        { stepCode: "gov_align", stepTitle: "Alignement partenaires", stepDescription: "Revue buyer/seller avant nouvelles opérations commerce.", stepOrder: 2, blockingStep: true },
        { stepCode: "gov_approve", stepTitle: "Approbation humaine", stepDescription: "Validation explicite requise — pas d'autopilot.", stepOrder: 3, blockingStep: true },
      ],
      COLLAPSE_PREVENTION: [
        { stepCode: "collapse_assess", stepTitle: "Évaluation collapse", stepDescription: "Indice collapse SLA et signaux prédictifs 20.13.", stepOrder: 1, blockingStep: true },
        { stepCode: "collapse_contain", stepTitle: "Containment collapse", stepDescription: "Prioriser stabilisation avant nouvelles charges.", stepOrder: 2, blockingStep: true },
        { stepCode: "collapse_validate", stepTitle: "Validation humaine critique", stepDescription: "Approbation obligatoire — orchestration critique.", stepOrder: 3, blockingStep: true },
      ],
      PARTNER_ALIGNMENT: [
        { stepCode: "partner_review", stepTitle: "Revue partenaire", stepDescription: "Double validation buyer/seller sur réceptions partielles.", stepOrder: 1, blockingStep: true },
        { stepCode: "partner_confirm", stepTitle: "Confirmation alignée", stepDescription: "Confirmer séquence validation partenaire.", stepOrder: 2, blockingStep: false },
      ],
      DOCUMENT_REINFORCEMENT: [
        { stepCode: "doc_inventory", stepTitle: "Inventaire preuves", stepDescription: "Lister fulfillments avec preuve requise non validée.", stepOrder: 1, blockingStep: true },
        { stepCode: "doc_validate", stepTitle: "Renforcer validation documentaire", stepDescription: "Prioriser validation preuves documentaires.", stepOrder: 2, blockingStep: true },
      ],
    };
    return plans[type] ?? [];
  }

  buildPlanFromType(
    type: RelationalOperationalOrchestrationType,
    relationshipId: string,
    riskScore: number,
    title: string,
    description: string,
  ): OrchestrationPlanCandidate {
    return {
      code: this.buildCode(type, relationshipId),
      type,
      priority: this.priorityFromRiskScore(riskScore),
      title,
      description,
      riskScore: Math.min(100, Math.max(0, Math.round(riskScore))),
      confidenceLevel: 85,
      requiresHumanValidation: this.requiresHumanValidation(type),
      steps: this.stepTemplatesFor(type),
    };
  }
}
