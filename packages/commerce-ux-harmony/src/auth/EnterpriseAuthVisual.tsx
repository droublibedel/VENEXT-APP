/** Visuels auth premium — abstraits, crédibles, sans stock photo (Instruction 20.87-A). */

export function EnterpriseAuthVisual() {
  return (
    <div className="venext-auth-visual-scene" aria-hidden>
      <div className="venext-auth-visual-scene__glow" />
      <svg
        className="venext-auth-visual-scene__svg"
        viewBox="0 0 400 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="24" y="200" width="72" height="88" rx="8" fill="rgba(255,255,255,0.12)" />
        <rect x="108" y="168" width="88" height="120" rx="8" fill="rgba(255,255,255,0.18)" />
        <rect x="208" y="184" width="64" height="104" rx="8" fill="rgba(255,255,255,0.1)" />
        <path
          d="M40 200 L120 140 L200 168 L320 96 L376 120"
          stroke="rgba(94,234,212,0.55)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="120" cy="140" r="6" fill="#5eead4" />
        <circle cx="200" cy="168" r="6" fill="#5eead4" />
        <circle cx="320" cy="96" r="6" fill="#5eead4" />
        <rect x="48" y="48" width="140" height="72" rx="12" fill="rgba(15,23,42,0.35)" stroke="rgba(255,255,255,0.15)" />
        <rect x="60" y="64" width="48" height="6" rx="3" fill="rgba(255,255,255,0.35)" />
        <rect x="60" y="78" width="96" height="6" rx="3" fill="rgba(255,255,255,0.2)" />
        <rect x="60" y="92" width="72" height="6" rx="3" fill="rgba(255,255,255,0.15)" />
        <rect x="220" y="40" width="120" height="80" rx="12" fill="rgba(13,148,136,0.25)" stroke="rgba(94,234,212,0.3)" />
        <rect x="236" y="56" width="40" height="40" rx="8" fill="rgba(255,255,255,0.12)" />
        <rect x="284" y="60" width="40" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
        <rect x="284" y="76" width="32" height="6" rx="3" fill="rgba(255,255,255,0.18)" />
      </svg>
      <div className="venext-auth-visual-scene__badges">
        <span>Distribution</span>
        <span>Industrie</span>
        <span>Terrain</span>
        <span>Logistique</span>
      </div>
    </div>
  );
}
