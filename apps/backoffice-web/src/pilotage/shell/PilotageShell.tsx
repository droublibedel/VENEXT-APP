"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { pilotageFrCi as t } from "../i18n/fr-ci";
import { useBackofficeAuth } from "../auth/BackofficeAuthProvider";

const PILOTAGE_NAV = [
  { href: "/pilotage", label: t.dashboard },
  { href: "/pilotage/users", label: t.users },
  { href: "/pilotage/enterprises", label: t.enterprises },
  { href: "/pilotage/journeys", label: t.journeys },
  { href: "/pilotage/errors", label: t.errors },
  { href: "/pilotage/support", label: t.support },
  { href: "/pilotage/health", label: t.health },
  { href: "/pilotage/apps", label: t.apps },
  { href: "/pilotage/audit", label: t.audit },
  { href: "/pilotage/search", label: t.search },
] as const;

const GOVERNANCE_NAV = [
  { href: "/pilotage/flags", label: t.flags },
  { href: "/pilotage/quality", label: t.quality },
  { href: "/pilotage/documents", label: t.documents },
  { href: "/governance/overview", label: t.governance },
] as const;

export function PilotageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useBackofficeAuth();

  return (
    <div className="bo-layout">
      <aside className="bo-nav">
        <p className="bo-brand">{t.appTitle}</p>

        <p className="bo-nav-section">Pilotage</p>
        <nav>
          {PILOTAGE_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "bo-nav-active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="bo-nav-section">Gouvernance</p>
        <nav>
          {GOVERNANCE_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "bo-nav-active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button type="button" className="bo-logout" onClick={() => logout()}>
          {t.logout}
        </button>
      </aside>
      <main className="bo-main">{children}</main>
    </div>
  );
}
