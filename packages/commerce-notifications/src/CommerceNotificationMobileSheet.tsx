import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function CommerceNotificationMobileSheet({ open, onClose, children }: Props) {
  if (!open) return null;
  return (
  <>
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          border: "none",
          zIndex: 199,
        }}
      />
      <div className="cn-sheet" data-testid="cn-mobile-sheet">
        {children}
      </div>
    </>
  );
}
