import type { CSSProperties, ReactNode } from "react";

export type VenextCommerceScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  trailing?: ReactNode;
  platform?: "mobile" | "web";
  className?: string;
  style?: CSSProperties;
};

export function VenextCommerceScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = "Retour",
  trailing,
  platform = "mobile",
  className = "",
  style,
}: VenextCommerceScreenHeaderProps) {
  return (
    <header
      className={`venext-screen-header venext-screen-header--${platform} ${className}`.trim()}
      style={style}
    >
      <div className="venext-screen-header__row">
        {onBack ? (
          <button
            type="button"
            className="venext-screen-header__back"
            onClick={onBack}
            aria-label={backLabel}
          >
            ← {backLabel}
          </button>
        ) : (
          <span className="venext-screen-header__spacer" aria-hidden />
        )}
        {trailing ? <div className="venext-screen-header__trailing">{trailing}</div> : null}
      </div>
      <h1 className="venext-screen-header__title">{title}</h1>
      {subtitle ? <p className="venext-screen-header__subtitle">{subtitle}</p> : null}
    </header>
  );
}
