import type { FormEvent, ReactNode } from "react";

import { VenextSkeletonForm } from "../skeleton/VenextSkeletonComponents";
import { EnterpriseAuthVisual } from "./EnterpriseAuthVisual";

export type EnterpriseAuthExperienceProps = {
  title?: string;
  subtitle?: string;
  loading?: boolean;
  onSubmit?: (e: FormEvent) => void;
  children?: ReactNode;
  brandName?: string;
};

/**
 * Auth web entreprise premium — 55% visuel / 45% formulaire (Instruction 20.87-A).
 */
export function EnterpriseAuthExperience({
  title = "Connexion professionnelle",
  subtitle = "Accédez à votre espace commerce en toute sérénité.",
  loading = false,
  onSubmit,
  children,
  brandName = "VENEXT",
}: EnterpriseAuthExperienceProps) {
  return (
    <div className="venext-auth-enterprise" data-testid="enterprise-auth-experience">
      <div className="venext-auth-enterprise__visual" aria-hidden={loading}>
        <div className="venext-auth-enterprise__visual-inner">
          <EnterpriseAuthVisual />
          <p className="venext-auth-enterprise__eyebrow">{brandName}</p>
          <h2 className="venext-auth-enterprise__visual-title">
            Commerce réel, distribution africaine, intelligence terrain.
          </h2>
          <p className="venext-auth-enterprise__visual-copy">
            Reliez producteurs, grossistes et détaillants dans un réseau maîtrisé — sans bruit, sans friction.
          </p>
          <ul className="venext-auth-enterprise__visual-points">
            <li>Traçabilité et confiance relationnelle</li>
            <li>Pilotage industriel et exécution terrain</li>
            <li>Expérience calme, pensée pour des journées longues</li>
          </ul>
        </div>
      </div>
      <div className="venext-auth-enterprise__panel">
        <div className="venext-auth-enterprise__form-wrap">
          <h1 className="venext-auth-enterprise__title">{title}</h1>
          <p className="venext-auth-enterprise__subtitle">{subtitle}</p>
          {loading ? (
            <VenextSkeletonForm />
          ) : (
            <form className="venext-auth-enterprise__form" onSubmit={onSubmit}>
              {children ?? (
                <>
                  <label className="venext-auth-enterprise__field">
                    <span>Identifiant professionnel</span>
                    <input type="email" name="email" autoComplete="username" placeholder="vous@entreprise.ci" />
                  </label>
                  <label className="venext-auth-enterprise__field">
                    <span>Mot de passe</span>
                    <input type="password" name="password" autoComplete="current-password" />
                  </label>
                  <button type="submit" className="venext-btn-harmony venext-btn-harmony--primary">
                    Continuer
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
